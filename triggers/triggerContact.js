const sample = require("../samples/sampleContact");
const fs = require("fs");
const utils = require("../utils/Utilities");

async function saveToJson (object, filename) {
    const json = JSON.stringify(object, null, 2);
    await fs.writeFile(filename, json, "utf-8",(err)=>{
        if (err) console.log(err);
    });
}

const getContactAddressesByType = (z, bundle, contactId, addressTypeId) => {


    const url = '{{bundle.authData.bpmonlineurl}}/0/ServiceModel/EntityDataService.svc/ContactAddressCollection?' +
        "$select=Id,Address,Zip,Primary,Contact/Id,Contact/Name,Country/Id,Country/Name," +
        "Region/Id,Region/Name,City/Id,City/Name,AddressType/Id,AddressType/Name" +
        "&$expand=Contact,Country,Region,City,AddressType" +
        "&$filter=" +
        "Contact/Id eq guid'" + contactId + "' and " +
        "AddressType/Id eq guid'" + addressTypeId + "'";

    const promise = z.request({
        method: 'GET',
        url: url,
    });

    return promise
        .then(
            response => {
                let results = JSON.parse(response.content).d.results;
                // todo: make dummy address object
                let result =utils. dummyAddress;
                if (results.length > 0) {
                    result = results[0];
                    // todo: think about __metadata
                    delete result.__metadata;
                    delete result.AddressType.__metadata;
                    delete result.Country.__metadata;
                    delete result.City.__metadata;
                    delete result.Region.__metadata;
                    delete result.Contact.__metadata;
                }
                return result;
            }
        )
}

const getContacts = (z, bundle) => {

    const url = '{{bundle.authData.bpmonlineurl}}/0/ServiceModel/EntityDataService.svc/ContactCollection?' +
        '$select=Id,CreatedOn,Name,Surname,GivenName,MiddleName,JobTitle,MobilePhone,Phone,Email,Notes,Account/Id,Account/Name,Account/Type/Id,Account/Type/Name' +
        '&$orderby=CreatedOn desc' +
        "&$expand=Account,Account/Type";
    const promise = z.request({
        method: 'GET',
        // todo: sort in reverse-chronological order to make sure new/updated items can be found on the first page of results
        // see https://zapier.com/developer/documentation/v2/deduplication/
        url: url,
    });
    return promise
        .then(
            response => {
                var results = JSON.parse(response.content).d.results;
                // Got error with "Id" fields. Have to rename them.
                // see https://zapier.com/developer/documentation/v2/app-checks-reference/#ZDE009
                results = results.map(function (contact) {
                    contact.id = contact.Id;
                    delete contact.Id;
                    // todo: think about __metadata
                    delete contact.__metadata;
                    delete contact.Account.__metadata;
                    delete contact.Account.Type.__metadata;
                    return contact;
                });
                //   z.console.log("triggerContact results");
                //   z.console.log(results);
                return results;
            });
}

async function triggerContact(z, bundle) {
    let contacts = await getContacts(z, bundle);

    let len = contacts.length;
    for (let i = 0; i < len ; i++){
        let addressTypeId = "fb7a3f6a-f36b-1410-6f81-1c6f65e50343"; //business
        let address =  await getContactAddressesByType(z, bundle, contacts[i].id, addressTypeId);
        contacts[i].BusinessAddress = address;
    }
    await saveToJson(contacts, "c:\\sample.json");
    return contacts;
};

module.exports = {
    key: 'contact',
    noun: 'Contact',

    display: {
        label: 'Get New Contact',
        description: 'Triggers on a contact creation.'
    },

    operation: {
        inputFields: [
            //todo: Add filter by contact address type
            { key: 'filter', required: false, label: 'Filter', choices: { all: 'all' }, helpText: 'Default is "all"' }
        ],
        perform: triggerContact,
        sample: sample
    }
};

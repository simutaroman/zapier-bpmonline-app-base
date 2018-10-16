const sample = require("../samples/sampleContact");
const triggerContact = (z, bundle) => {
    const responsePromise = z.request({
        method: 'GET',
        // todo: sort in reverse-chronological order to make sure new/updated items can be found on the first page of results
        // see https://zapier.com/developer/documentation/v2/deduplication/
        url: '{{bundle.authData.bpmonlineurl}}/0/ServiceModel/EntityDataService.svc/ContactCollection?'+
        '$select=Id,Name,CreatedOn'+
        '&$orderby=CreatedOn desc',
    });
    return responsePromise
        .then(
            response => {
                var results = JSON.parse(response.content).d.results;
                // Got error with "Id" fields. Have to rename them.
                // see https://zapier.com/developer/documentation/v2/app-checks-reference/#ZDE009
                results = results.map(function(contact){
                    contact.id = contact.Id;
                    delete contact.Id;
                    // todo: think about __metadata
                    delete contact.__metadata;
                    return contact
                  });
                  z.console.log("triggerContact results");
                  z.console.log(results);
                return results;
            });
};

module.exports = {
    key: 'contact',
    noun: 'Contact',

    display: {
        label: 'Get Contacts',
        description: 'Triggers on a new contact.'
    },

    operation: {
        inputFields: [
            { key: 'filter', required: false, label: 'Filter', choices: { all: 'all' }, helpText: 'Default is "all"' }
        ],
        perform: triggerContact,

        // todo: contact example
        sample: sample
    }
};

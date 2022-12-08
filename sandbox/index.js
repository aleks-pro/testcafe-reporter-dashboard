const fs             = require('fs');
const mock           = require('mock-require');
const createTestCafe = require('testcafe');

process.env.TESTCAFE_DASHBOARD_DEVEXTREME_URL   = 'https://fcl2bv.resolve.sh';
process.env.TESTCAFE_DASHBOARD_DEVEXTREME_TOKEN = 'eyJwcm9qZWN0SWQiOiJkNWI1NDYxOS1iMjE5LTRkODItYTg2ZS05YWQ0OThiNzE0NDYiLCJ0b2tlblNlY3JldCI6InFCYncvRjlSeTJjamd3SGIyb1pzZ0l2alBxY3ZWdEY0U0l3Tnd5ellxWloxeGFQUnRIenY3YlIyeWNIakNrYlo2SVRCZWFnRGNmZUM5LzR2TTBJWmpsdDNkRzV2L1NiK3ZwY2s4aS80YU1Ub1U4YUdQd2pjVGZuZ2ZlZHdvRjBEaHA3NjdCMC9GamEzQlkzSC9jZjFmRllZZEVWU1g2NHozZXlMVnBIK3RQbXF6b0RjL3U5RHJZdm8wREVVNFpTN3lzSDV5SmtZbThQRlpSUVJPMlM2VSszQlJSYzlCY3VLWW9Sb3FGeVdjS0JtaTR0S1FLOEQvNGVBdHJleEd3bGFieHQ2WmpSOXN0NHcwdHgyWGpYbGpvRFhaOUd3OGt4d0VYd2dHWFhuK0UvT0c5WkZZb0txaWdGTFNGQ3VYTXEvZ0VzSlJRUTBoaWU4ZVFacVJLblpKdz09In0=';

const REPORTER_DIRECTORY = './node_modules/testcafe-reporter-dashboard-sandbox';

if (!fs.existsSync(REPORTER_DIRECTORY))
    fs.mkdirSync(REPORTER_DIRECTORY);

mock('testcafe-reporter-dashboard-sandbox', '../lib/index.js');

let testcafe = null;

createTestCafe()
    .then(tc => {
        testcafe = tc;

        const runner = tc.createRunner();

        return runner
            .src(['./sandbox/test.ts'])
            .browsers(['chrome', 'chrome:headless'])
            //.video('video_artifacts', { pathPattern: '${TEST_INDEX}_${USERAGENT}/${QUARANTINE_ATTEMPT}.mp4' })
            .reporter('dashboard-sandbox')
            .run();
    })
    .then(failedCount => {
        console.log('Tests failed: ' + failedCount);

        testcafe && testcafe.close();
    });

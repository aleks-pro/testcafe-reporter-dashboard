import assert from 'assert';
import { buildReporterPlugin } from 'testcafe/lib/embedding-utils';
import { AggregateCommandType, TestStartInfo } from '../../src/types/internal';
import reporterObjectFactory from '../../src/reporter-object-factory';
import logger from '../../src/logger';
import { TC_OLDEST_COMPATIBLE_VERSION } from '../../src/validate-settings';
import { mockReadFile, SETTINGS, TESTCAFE_DASHBOARD_URL } from '../mocks';
import { WARNINGS_TEST_RUN_ID_1 } from '../data/test-warnings-info';
import { ReportWarningArgs } from '../../src/types/report-warning-args';

describe('ReportWarnings', () => {
    let reportWarningspayload: ReportWarningArgs = {} as ReportWarningArgs;

    function fetch (url, request) {
        if (url === `${TESTCAFE_DASHBOARD_URL}/api/commands/`) {
            const { type, payload } = JSON.parse(request.body);

            if (type === AggregateCommandType.reportWarnings)
                reportWarningspayload = payload;
        }

        if (url === `${TESTCAFE_DASHBOARD_URL}/api/validateReporter`)
            return Promise.resolve({ ok: true, status: 200, statusText: 'OK' } as Response);

        throw new Error('Unknown request');
    }

    it('reportWarnings payload', async () => {
        const reporter = buildReporterPlugin(() => reporterObjectFactory(
            mockReadFile, fetch, SETTINGS, logger, TC_OLDEST_COMPATIBLE_VERSION
        ), process.stdout);

        const warningTestId = 'warningsTestId';

        const testRunInfo: TestStartInfo = {
            testId:     warningTestId,
            testRunId:  [''],
            testRunIds: [WARNINGS_TEST_RUN_ID_1]
        };

        await reporter.reportTestStart('', {}, testRunInfo);

        await reporter.reportWarnings({ message: 'warning', testRunId: 'notStartedTest' });
        assert.deepStrictEqual(reportWarningspayload, { });

        await reporter.reportWarnings({ message: 'warning', testRunId: WARNINGS_TEST_RUN_ID_1 });
        assert.deepStrictEqual(reportWarningspayload, { testId: warningTestId });
    });
});
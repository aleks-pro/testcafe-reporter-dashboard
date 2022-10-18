import { AggregateCommandType, AggregateNames } from './types/internal/';
import { TaskStartArgs, TestStartArgs, TaskDoneArgs, TestDoneArgs, ReportWarningArgs } from './types/';
import Transport from './transport';
import { Uploader } from './upload';

export default function reportCommandsFactory (reportId: string, transport: Transport, uploader: Uploader) {
    async function sendReportCommand (
        type: AggregateCommandType,
        payload: Record<string, unknown>
    ): Promise<void> {
        return transport.sendResolveCommand({
            aggregateId:   reportId,
            aggregateName: AggregateNames.Run,
            type,
            payload
        });
    }

    let _report = {
        id:                 '',
        started:            0,
        completed:          0,
        runs:               [ reportId ],
        startTime:          null,
        activeRunsCount:    1,
        endTime:            null,
        testCount:          0,
        failed:             0,
        skipped:            0,
        isTerminated:       false,
        userAgents:         null,
        duration:           null,
        fixtures:           [] as { id: string; name: string; tests: {} }[],
        aggregatedWarnings: [],
        ciInfo:             null as any
    };

    let _uploadUrl = '';

    return {
        async sendTaskStartCommand (payload: TaskStartArgs): Promise<void> {
            _report = {
                id:                 payload.buildId as any,
                started:            0,
                completed:          0,
                runs:               [ reportId ],
                startTime:          payload.startTime as any,
                activeRunsCount:    1,
                endTime:            null,
                testCount:          payload.testCount,
                failed:             0,
                skipped:            0,
                isTerminated:       false,
                userAgents:         payload.userAgents as any,
                duration:           null,
                aggregatedWarnings: [],
                ciInfo:             payload.ciInfo,
                fixtures:           payload.taskStructure.map(({ fixture }) => {
                    const { id, name, tests } = fixture;

                    return {
                        id,
                        name,
                        tests: tests.reduce((prev, current) => {
                            return {
                                ...prev,
                                [current.id]: {
                                    id:            current.id,
                                    name:          current.name,
                                    status:        'pending',
                                    duration:      null,
                                    errorCount:    0,
                                    uploadId:      null,
                                    unstable:      false,
                                    warningsCount: 0
                                }
                            };
                        }, {})
                    };
                }) as any
            };

            const { uploadId, uploadUrl } = await uploader.uploadReportState(reportId, _report);

            _uploadUrl = uploadUrl;

            return sendReportCommand(AggregateCommandType.reportTaskStart, { ...payload, uploadId });
        },
        async sendTestStartCommand (payload: TestStartArgs): Promise<void> {
            //return sendReportCommand(AggregateCommandType.reportTestStart, payload);

            const fixture = _report.fixtures.find(({ tests }) => {
                return !!tests[payload.testId];
            });

            if (fixture) {
                fixture.tests[payload.testId].status = 'inProgress';

                _report.started++;
            }

            await uploader.updateReportState(_uploadUrl, reportId, _report);
        },
        async sendTestDoneCommand (payload: TestDoneArgs): Promise<void> {
            //return sendReportCommand(AggregateCommandType.reportTestDone, payload);
            const fixture = _report.fixtures.find(({ tests }) => {
                return !!tests[payload.testId];
            });

            if (fixture) {
                const test = fixture.tests[payload.testId];

                if (payload.errorCount > 0) {
                    test.status = 'failed';
                    _report.failed++;
                }
                else
                    test.status = 'passed';

                test.status = payload.errorCount > 0 ? 'failed' : 'passed';
                test.error  = payload.errorCount;
                test.duration = payload.duration;
                test.uploadId = payload.uploadId;
                test.unstable = payload.unstable;

                _report.completed++;
                _report.started--;
            }

            await uploader.updateReportState(_uploadUrl, reportId, _report);
        },
        async sendTaskDoneCommand (payload: TaskDoneArgs): Promise<void> {
            _report.endTime = payload.endTime as any;
            _report.started = 0;
            _report.failed = payload.result.failedCount;
            _report.skipped = payload.result.skippedCount;
            _report.activeRunsCount = 0;

            await uploader.updateReportState(_uploadUrl, reportId, _report);

            return sendReportCommand(AggregateCommandType.reportTaskDone, payload);
        },
        async sendReportWarningsCommand (payload: ReportWarningArgs): Promise<void> {
            const fixture = _report.fixtures.find(({ tests }) => {
                return !!tests[payload.testId];
            });

            if (fixture) {
                fixture.tests[payload.testId].warningsCount++;

                await uploader.updateReportState(_uploadUrl, reportId, _report);
            }
            //return sendReportCommand(AggregateCommandType.reportWarnings, payload);
        }
    };
};

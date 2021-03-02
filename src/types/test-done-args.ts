
import * as t from 'io-ts';
import { ShortIdSchema } from './common';


export const TestDoneArgsSchema = t.readonly(
    t.exact(
        t.type({
            testId:     ShortIdSchema,
            skipped:    t.boolean,
            errorCount: t.number,
            duration:   t.number,
            uploadId:   t.string
        })
    )
);

export type TestDoneArgs = t.TypeOf<typeof TestDoneArgsSchema>;


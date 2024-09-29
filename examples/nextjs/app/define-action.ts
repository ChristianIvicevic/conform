import { z } from 'zod';
import { SubmissionResult } from '@conform-to/dom';
import { parseWithZod } from '@conform-to/zod';

type ActionFn = (
	lastState: unknown,
	formData: FormData,
) => Promise<SubmissionResult>;

type ActionWithSchema<Schema extends z.ZodTypeAny> = ActionFn & {
	inputSchema: Schema;
};

export function defineAction<Schema extends z.ZodTypeAny>({
	schema,
	handler,
}: {
	schema: Schema;
	handler: (args: {
		input: z.infer<Schema>;
		resolve: () => SubmissionResult;
		reject: (...formErrors: string[]) => SubmissionResult;
	}) => Promise<SubmissionResult>;
}): ActionWithSchema<Schema> {
	const action: ActionFn = async (_lastState, formData) => {
		const submission = parseWithZod(formData, { schema });
		if (submission.status !== 'success') {
			return submission.reply();
		}

		const input = submission.value;
		const resolve = () => ({ status: 'success' as const });
		const reject = (...formErrors: string[]) =>
			submission.reply({ formErrors });

		return handler({ input, resolve, reject });
	};
	return Object.assign(action, { inputSchema: schema });
}

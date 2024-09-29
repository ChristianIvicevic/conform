'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { login, signup, createTodos, staleAction } from '@/app/actions';
import {
	useForm,
	getFormProps,
	getInputProps,
	getFieldsetProps,
} from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import {
	todosSchema,
	loginSchema,
	createSignupSchema,
	staleSchema,
} from '@/app/schema';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
	const { pending } = useFormStatus();

	return <button {...props} disabled={pending || props.disabled} />;
}

export function TodoForm() {
	const [lastResult, action] = useFormState(createTodos, undefined);
	const [form, fields] = useForm({
		lastResult,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: todosSchema });
		},
		shouldValidate: 'onBlur',
	});
	const tasks = fields.tasks.getFieldList();

	return (
		<form action={action} {...getFormProps(form)}>
			<div>
				<label>Title</label>
				<input
					className={!fields.title.valid ? 'error' : ''}
					{...getInputProps(fields.title, { type: 'text' })}
					key={fields.title.key}
				/>
				<div>{fields.title.errors}</div>
			</div>
			<hr />
			<div className="form-error">{fields.tasks.errors}</div>
			{tasks.map((task, index) => {
				const taskFields = task.getFieldset();

				return (
					<fieldset key={task.key} {...getFieldsetProps(task)}>
						<div>
							<label>Task #{index + 1}</label>
							<input
								className={!taskFields.content.valid ? 'error' : ''}
								{...getInputProps(taskFields.content, { type: 'text' })}
								key={taskFields.content.key}
							/>
							<div>{taskFields.content.errors}</div>
						</div>
						<div>
							<label>
								<span>Completed</span>
								<input
									className={!taskFields.completed.valid ? 'error' : ''}
									{...getInputProps(taskFields.completed, {
										type: 'checkbox',
									})}
									key={taskFields.completed.key}
								/>
							</label>
						</div>
						<Button
							{...form.remove.getButtonProps({
								name: fields.tasks.name,
								index,
							})}
						>
							Delete
						</Button>
						<Button
							{...form.reorder.getButtonProps({
								name: fields.tasks.name,
								from: index,
								to: 0,
							})}
						>
							Move to top
						</Button>
						<Button
							{...form.update.getButtonProps({
								name: task.name,
								value: { content: '' },
							})}
						>
							Clear
						</Button>
					</fieldset>
				);
			})}
			<Button {...form.insert.getButtonProps({ name: fields.tasks.name })}>
				Add task
			</Button>
			<hr />
			<Button>Save</Button>
		</form>
	);
}

export function LoginForm() {
	const [lastResult, action] = useFormState(login, undefined);
	const [form, fields] = useForm({
		// Sync the result of last submission
		lastResult,

		// Reuse the validation logic on the client
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: loginSchema });
		},

		// Validate the form on blur event triggered
		shouldValidate: 'onBlur',
	});

	return (
		<form action={action} {...getFormProps(form)}>
			<div>
				<label>Email</label>
				<input
					className={!fields.email.valid ? 'error' : ''}
					{...getInputProps(fields.email, { type: 'text' })}
					key={fields.email.key}
				/>
				<div>{fields.email.errors}</div>
			</div>
			<div>
				<label>Password</label>
				<input
					className={!fields.password.valid ? 'error' : ''}
					{...getInputProps(fields.password, { type: 'password' })}
					key={fields.password.key}
				/>
				<div>{fields.password.errors}</div>
			</div>
			<label>
				<div>
					<span>Remember me</span>
					<input {...getInputProps(fields.remember, { type: 'checkbox' })} />
				</div>
			</label>
			<hr />
			<Button>Login</Button>
		</form>
	);
}

export function SignupForm() {
	const [lastResult, action] = useFormState(signup, undefined);
	const [form, fields] = useForm({
		lastResult,
		onValidate({ formData }) {
			return parseWithZod(formData, {
				// Create the schema without any constraint defined
				schema: (control) => createSignupSchema(control),
			});
		},
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onInput',
	});

	return (
		<form action={action} {...getFormProps(form)}>
			<label>
				<div>Username</div>
				<input
					className={!fields.username.valid ? 'error' : ''}
					{...getInputProps(fields.username, { type: 'text' })}
					key={fields.username.key}
				/>
				<div>{fields.username.errors}</div>
			</label>
			<label>
				<div>Password</div>
				<input
					className={!fields.password.valid ? 'error' : ''}
					{...getInputProps(fields.password, { type: 'password' })}
					key={fields.password.key}
				/>
				<div>{fields.password.errors}</div>
			</label>
			<label>
				<div>Confirm Password</div>
				<input
					className={!fields.confirmPassword.valid ? 'error' : ''}
					{...getInputProps(fields.confirmPassword, { type: 'password' })}
					key={fields.confirmPassword.key}
				/>
				<div>{fields.confirmPassword.errors}</div>
			</label>
			<hr />
			<Button>Signup</Button>
		</form>
	);
}

export function StaleForm({ value }: { value: string }) {
	const router = useRouter();
	const [lastResult, action] = useFormState(staleAction, undefined);
	const [form, fields] = useForm({
		lastResult,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: staleSchema });
		},
		defaultValue: { value },
	});

	useEffect(() => {
		if (lastResult?.status === 'success') {
			router.refresh();
		}
	}, [lastResult, router]);

	return (
		<form action={action} {...getFormProps(form)}>
			<div>Current value from parent: {value}</div>
			<div>
				<label>Value</label>
				<input
					className={!fields.value.valid ? 'error' : ''}
					{...getInputProps(fields.value, { type: 'text' })}
					key={fields.value.key}
				/>
				<div>{fields.value.errors}</div>
			</div>
			<Button>Submit</Button>
		</form>
	);
}

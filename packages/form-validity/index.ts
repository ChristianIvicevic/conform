/**
 * form-validity
 */
const symbol = Symbol('constraint');

type FieldTag = 'input' | 'textarea' | 'select' | 'fieldset';

type InputType =
	| 'checkbox'
	| 'color'
	| 'date'
	| 'date'
	| 'datetime-local'
	| 'email'
	| 'fieldset'
	| 'file'
	| 'hidden'
	| 'month'
	| 'number'
	| 'password'
	| 'radio'
	| 'range'
	| 'search'
	| 'select'
	| 'tel'
	| 'text'
	| 'textarea'
	| 'time'
	| 'url'
	| 'week';

type ConstraintType =
	| 'required'
	| 'length'
	| 'range:date'
	| 'range:number'
	| 'step'
	| 'pattern'
	| 'multiple';

interface Required {
	required(message?: string): this;
}

interface Range<Value> {
	min(value: Value | string, message?: string): this;
	max(value: Value | string, message?: string): this;
}

interface Length {
	minLength(number: number, message?: string): this;
	maxLength(number: number, message?: string): this;
}

interface Pattern {
	pattern(regexp: RegExp, message?: string): this;
}

interface Step {
	step(number: number | string, message?: string): this;
}

interface Multiple {
	multiple(): this;
}

type FieldCreator<Type extends ConstraintType> = ('required' extends Type
	? Required
	: {}) &
	('length' extends Type ? Length : {}) &
	('range:date' extends Type ? Range<Date> : {}) &
	('range:number' extends Type ? Range<number> : {}) &
	('step' extends Type ? Step : {}) &
	('pattern' extends Type ? Pattern : {}) &
	('multiple' extends Type ? Multiple : {});

export type Field<
	Tag extends FieldTag = FieldTag,
	Type extends InputType | 'default' | 'array' = 'default',
> = (Tag extends 'input'
	? Type extends 'checkbox' | 'file' | 'radio'
		? FieldCreator<'required'>
		: Type extends 'date' | 'datetime-local' | 'month' | 'time' | 'week'
		? FieldCreator<'required' | 'range:date' | 'step'>
		: Type extends 'email' | 'password' | 'search' | 'tel' | 'text' | 'url'
		? FieldCreator<'required' | 'length' | 'pattern'>
		: Type extends 'number'
		? FieldCreator<'required' | 'range:number' | 'step'>
		: Type extends 'range'
		? FieldCreator<'range:number' | 'step'>
		: {}
	: Tag extends 'select'
	? FieldCreator<'required'>
	: Tag extends 'textarea'
	? FieldCreator<'required' | 'length'>
	: Tag extends 'fieldset'
	? Type extends 'array'
		? FieldCreator<'range:number'>
		: {}
	: unknown) & { [symbol]: Constraint<Tag> };

type Constraint<Tag extends FieldTag = FieldTag> = {
	tag: Tag;
	type?: {
		value: InputType;
		message: string | undefined;
	};
	required?: {
		message: string | undefined;
	};
	minLength?: {
		value: number;
		message: string | undefined;
	};
	maxLength?: {
		value: number;
		message: string | undefined;
	};
	min?: {
		value: Date | number;
		message: string | undefined;
	};
	max?: {
		value: Date | number;
		message: string | undefined;
	};
	step?: {
		value: number | string;
		message: string | undefined;
	};
	pattern?: Array<{
		value: RegExp;
		message: string | undefined;
	}>;
	multiple?: {
		message: string | undefined;
	};
	count?: number;
};

function configureF() {
	function createField<Tag extends FieldTag>(constraint: Constraint<Tag>) {
		return {
			required(message?: string) {
				return createField({
					...constraint,
					required: { message },
				});
			},
			min(value: number | Date, message?: string) {
				return createField({
					...constraint,
					min: { value, message },
				});
			},
			max(value: number | Date, message?: string) {
				return createField({
					...constraint,
					max: { value, message },
				});
			},
			minLength(value: number, message?: string) {
				return createField({
					...constraint,
					minLength: { value, message },
				});
			},
			maxLength(value: number, message?: string) {
				return createField({
					...constraint,
					maxLength: { value, message },
				});
			},
			pattern(value: RegExp, message?: string) {
				if (value.global || value.ignoreCase || value.multiline) {
					console.warn(
						`global, ignoreCase, and multiline flags are not supported on the pattern attribute`,
					);

					return createField(constraint);
				}

				return createField({
					...constraint,
					pattern: [...(constraint.pattern ?? [])].concat({
						value,
						message,
					}),
				});
			},
			multiple(message?: string) {
				return createField({
					...constraint,
					multiple: { message },
				});
			},
			[symbol]: constraint,
		};
	}

	function input<T extends 'email' | 'number' | 'url'>(
		type: T,
		message?: string,
	): Field<'input', T>;
	function input<T extends Exclude<InputType, 'email' | 'number' | 'url'>>(
		type: T,
	): Field<'input', T>;
	function input<T extends InputType>(
		type: T,
		message?: string,
	): Field<'input', T> {
		// @ts-expect-error
		return createField({
			tag: 'input',
			type: { value: type, message },
		});
	}

	function select(): Field<'select'> {
		return createField({
			tag: 'select',
		});
	}

	function textarea(): Field<'textarea'> {
		return createField({
			tag: 'textarea',
		});
	}

	function fieldset(): Field<'fieldset'>;
	// @ts-expect-error
	function fieldset(count: number): Field<'fieldset', 'array'>;
	function fieldset(count?: number) {
		return createField({
			tag: 'fieldset',
			count,
		});
	}

	return {
		input,
		select,
		textarea,
		fieldset,
	};
}

/**
 * Helpers for constructing the field constraint based on the type
 * @see https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Constraint_validation#validation-related_attributes
 */
export const f = configureF();

export function getConstraint<Tag extends FieldTag>(
	field: Field<Tag>,
): Constraint<Tag> {
	if (typeof field[symbol] === 'undefined') {
		throw new Error(
			'Provided config is not a field; Please ensure only field object is used',
		);
	}

	return field[symbol];
}

export function isElement<T extends HTMLElement>(
	element: any,
	tag: string,
): element is T {
	return !!element && element.tagName.toLowerCase() === tag;
}

export function isDirty(element: unknown): boolean {
	if (isElement<HTMLFormElement>(element, 'form')) {
		for (let el of element.elements) {
			if (isDirty(el)) {
				return true;
			}
		}

		return false;
	}

	if (
		isElement<HTMLInputElement>(element, 'input') ||
		isElement<HTMLTextAreaElement>(element, 'textarea')
	) {
		return element.value !== element.defaultValue;
	}

	if (isElement<HTMLSelectElement>(element, 'select')) {
		return (
			element.value !==
			Array.from(element.options).find((option) => option.defaultSelected)
				?.value
		);
	}

	return false;
}

export function isValidationConstraintSupported(
	element: unknown,
): element is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
	if (
		!isElement<HTMLInputElement>(element, 'input') &&
		!isElement<HTMLSelectElement>(element, 'select') &&
		!isElement<HTMLTextAreaElement>(element, 'textarea')
	) {
		return false;
	}

	return typeof element.checkValidity === 'function';
}

export function shouldSkipValidate(element: unknown) {
	return isElement<HTMLButtonElement>(element, 'button') ||
		isElement<HTMLInputElement>(element, 'input')
		? element.formNoValidate
		: false;
}

export function draftUpdate(name: string, index?: number) {
	return {
		name: '__form-validity__',
		value: [name]
			.concat(typeof index === 'undefined' ? [] : [`${index}`])
			.join('|'),
	};
}

export function getDraft(payload: URLSearchParams | FormData) {
	const update = payload.get('__form-validity__');

	if (!update) {
		return null;
	}

	// We are mutating the payload here
	payload.delete('__form-validity__');

	if (update instanceof File) {
		throw new Error('What?');
	}

	const [name, indexString] = update.split('|');
	const index = typeof indexString !== 'undefined' ? Number(indexString) : null;

	return {
		name,
		index,
	};
}

export function parse<T>(
	payload: FormData | URLSearchParams | string,
	fieldsetCreator:
		| ((value?: Record<string, any>) => Record<string, T>)
		| Record<string, T>,
): {
	value: Record<string, any>;
	error: Record<string, string> | null;
	isDraft: boolean;
} {
	const valueEntries: URLSearchParams | FormData =
		payload instanceof URLSearchParams || payload instanceof FormData
			? payload
			: new URLSearchParams(payload);

	const update = getDraft(valueEntries);
	const value = unflatten(valueEntries);

	if (update) {
		const list = getItem(value, update.name);

		if (
			!Array.isArray(list) ||
			(update.index !== null && isNaN(update.index))
		) {
			throw new Error('Oops');
		}

		if (update.index !== null) {
			list.splice(update.index, 1);
		} else {
			list.push({});
		}
	}

	const fieldset =
		typeof fieldsetCreator === 'function'
			? fieldsetCreator(value)
			: fieldsetCreator;
	const valueByName = Object.fromEntries(valueEntries);
	const errorEntries: Array<[string, string]> = [];

	if (!update) {
		for (const [name, field] of flatten<Field>(
			fieldset,
			(f) => typeof f[symbol] !== 'undefined',
		)) {
			const constraint = getConstraint(field);
			const value = valueByName[name];
			const validity = validate(value, constraint);
			const message = checkCustomValidity(value, validity, constraint);

			if (message) {
				errorEntries.push([name, message]);
			}
		}
	}

	return {
		value,
		error: errorEntries.length > 0 ? unflatten(errorEntries) : null,
		isDraft: update !== null,
	};
}

/**
 * Helpers
 */

const pattern = /(\w+)\[(\d+)\]/;

function getPaths(key: string): Array<string | number> {
	return key.split('.').flatMap((key) => {
		const matches = pattern.exec(key);

		if (!matches) {
			return key;
		}

		return [matches[1], Number(matches[2])];
	});
}

function getItem(obj: any, key: string, defaultValue?: any): any {
	let target = obj;

	for (let path of getPaths(key)) {
		if (typeof target[path] === 'undefined') {
			return defaultValue;
		}

		target = target[path];
	}

	return target;
}

function flatten<T>(
	item: any,
	isLeaf: (item: any) => boolean,
	prefix = '',
): Array<[string, T]> {
	let entries: Array<[string, T]> = [];

	if (isLeaf(item)) {
		entries.push([prefix, item]);
	} else if (Array.isArray(item)) {
		for (var i = 0; i < item.length; i++) {
			entries.push(...flatten<T>(item[i], isLeaf, `${prefix}[${i}]`));
		}
	} else {
		for (const [key, value] of Object.entries(item)) {
			entries.push(
				...flatten<T>(value, isLeaf, prefix ? `${prefix}.${key}` : key),
			);
		}
	}

	return entries;
}

function unflatten<T>(
	entries: Array<[string, T]> | Iterable<[string, T]>,
): any {
	const result: any = {};

	for (let [key, value] of entries) {
		let paths = getPaths(key);
		let length = paths.length;
		let lastIndex = length - 1;
		let index = -1;
		let pointer = result;

		while (pointer != null && ++index < length) {
			let key = paths[index];
			let next = paths[index + 1];
			let newValue = value;

			if (index != lastIndex) {
				newValue = pointer[key] ?? (typeof next === 'number' ? [] : {});
			}

			pointer[key] = newValue;
			pointer = pointer[key];
		}
	}

	return result;
}

function validate(
	value: FormDataEntryValue | undefined,
	constraint: Constraint,
): ValidityState {
	let badInput = false;
	let customError = false;
	let patternMismatch = false;
	let rangeOverflow = false;
	let rangeUnderflow = false;
	let stepMismatch = false;
	let tooLong = false;
	let tooShort = false;
	let typeMismatch = false;
	let valueMissing = false;

	if (value instanceof File) {
		typeMismatch = constraint.type?.value !== 'file';
	} else {
		const isURL = (value: string) => {
			try {
				new URL(value);
				return true;
			} catch {
				return false;
			}
		};

		patternMismatch =
			constraint.pattern?.some((pattern) => {
				const match = value?.match(pattern.value);

				return !match || value !== match[0];
			}) ?? false;
		rangeOverflow = constraint.max
			? (typeof value !== 'undefined' &&
					constraint.max.value instanceof Date &&
					new Date(value) > constraint.max.value) ||
			  (typeof value !== 'undefined' &&
					typeof constraint.max.value === 'number' &&
					Number(value) > constraint.max.value)
			: false;
		rangeUnderflow = constraint.min
			? (constraint.min.value instanceof Date &&
					new Date(value ?? '') < constraint.min.value) ||
			  (typeof constraint.min.value === 'number' &&
					Number(value ?? '') < constraint.min.value)
			: false;
		tooLong = constraint.maxLength
			? typeof value !== 'undefined' &&
			  value.length > constraint.maxLength.value
			: false;
		tooShort = constraint.minLength
			? typeof value === 'undefined' ||
			  value.length < constraint.minLength.value
			: false;
		typeMismatch =
			(constraint.type?.value === 'email' && !/^\S+@\S+$/.test(value ?? '')) ||
			(constraint.type?.value === 'url' && !isURL(value ?? ''));
		valueMissing = typeof value === 'undefined' || value === '';
	}

	return {
		badInput,
		customError,
		patternMismatch,
		rangeOverflow,
		rangeUnderflow,
		stepMismatch,
		tooLong,
		tooShort,
		typeMismatch,
		valid:
			!badInput &&
			!customError &&
			!patternMismatch &&
			!rangeOverflow &&
			!rangeUnderflow &&
			!stepMismatch &&
			!tooLong &&
			!tooShort &&
			!typeMismatch &&
			!valueMissing,
		valueMissing,
	};
}

export function checkCustomValidity(
	value: FormDataEntryValue,
	validity: ValidityState,
	constraint: Constraint,
): string | null {
	if (validity.valueMissing) {
		return constraint.required?.message ?? null;
	} else if (validity.tooShort) {
		return constraint.minLength?.message ?? null;
	} else if (validity.tooLong) {
		return constraint.maxLength?.message ?? null;
	} else if (validity.stepMismatch) {
		return constraint.step?.message ?? null;
	} else if (validity.rangeUnderflow) {
		return constraint.min?.message ?? null;
	} else if (validity.rangeOverflow) {
		return constraint.max?.message ?? null;
	} else if (validity.typeMismatch || validity.badInput) {
		return constraint.type?.message ?? null;
	} else if (validity.patternMismatch) {
		if (!constraint.pattern) {
			return null;
		} else if (constraint.pattern.length === 1) {
			return constraint.pattern[0].message ?? null;
		} else {
			return (
				constraint.pattern.find((pattern) =>
					pattern.value.test(value as string),
				)?.message ?? null
			);
		}
	} else {
		return '';
	}
}

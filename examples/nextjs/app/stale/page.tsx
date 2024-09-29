import { StaleForm } from '@/app/form';
import * as fs from 'node:fs';

export const dynamic = 'force-dynamic';

export default async function Stale() {
	const value = await fs.promises
		.readFile('database.txt', 'utf-8')
		.catch(() => '');
	return <StaleForm value={value} />;
}

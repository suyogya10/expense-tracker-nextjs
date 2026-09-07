import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: todos, error } = await supabase.from('todos').select();

  return (
    <div className="p-8 max-w-md mx-auto space-y-4">
      <h1 className="text-xl font-bold">Supabase Connection Test</h1>
      {error ? (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
          <p className="font-semibold">Supabase query notice:</p>
          <p>{error.message}</p>
          <p className="mt-2 text-zinc-400">(Table "todos" will show items once created in Supabase SQL editor)</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {todos && todos.length > 0 ? (
            todos.map((todo: any) => (
              <li key={todo.id} className="p-3 rounded-lg border border-border bg-card">
                {todo.name}
              </li>
            ))
          ) : (
            <li className="text-sm text-muted-foreground">No todos found in Supabase.</li>
          )}
        </ul>
      )}
    </div>
  );
}

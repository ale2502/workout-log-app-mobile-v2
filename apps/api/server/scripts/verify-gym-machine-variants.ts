const API_URL = process.env.API_URL ?? 'http://localhost:3001';

async function request(path: string, options?: RequestInit) {
  const response = await fetch(`${API_URL}${path}`, options);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${path} failed with ${response.status}: ${body}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function main() {
  const gyms = await request('/gyms');
  const defaultGym = gyms.find(
    (gym: { name: string }) => gym.name === 'City Fitness Newmarket',
  );

  if (!defaultGym) {
    throw new Error('Default gym was not returned by GET /gyms');
  }

  const variant = await request('/exercise-variants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      exerciseId: 1,
      gymId: defaultGym.id,
      label: `Verification ${Date.now()}`,
    }),
  });

  const workout = await request('/workouts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gymId: defaultGym.id }),
  });

  const set = await request('/sets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workoutId: workout.id,
      exerciseId: 1,
      exerciseVariantId: variant.id,
      setNumber: 1,
      reps: 10,
      load: 50,
      rir: 2,
      note: null,
    }),
  });

  if (set.exerciseVariantId !== variant.id) {
    throw new Error('Created set did not return exerciseVariantId');
  }

  const detailSets = await request(`/workouts/${workout.id}/sets`);
  const detailSet = detailSets.find((row: { id: number }) => row.id === set.id);

  if (detailSet.exerciseVariantLabel !== variant.label) {
    throw new Error('Workout detail did not return variant label');
  }

  console.log('Gym machine variant verification passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

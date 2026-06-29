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
  const suffix = Date.now();
  const gym = await request('/gyms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: `Verification Gym ${suffix}` }),
  });

  const renamedGym = await request(`/gyms/${gym.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: `Renamed Verification Gym ${suffix}` }),
  });

  if (renamedGym.name !== `Renamed Verification Gym ${suffix}`) {
    throw new Error('PATCH /gyms/:id did not return the updated gym name');
  }

  const variant = await request('/exercise-variants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      exerciseId: 1,
      gymId: gym.id,
      label: `Verification Machine ${suffix}`,
    }),
  });

  const renamedVariant = await request(`/exercise-variants/${variant.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ label: `Renamed Verification Machine ${suffix}` }),
  });

  if (renamedVariant.label !== `Renamed Verification Machine ${suffix}`) {
    throw new Error(
      'PATCH /exercise-variants/:id did not return the updated machine label',
    );
  }

  const variants = await request(`/gyms/${gym.id}/exercise-variants`);
  const matchingVariant = variants.find(
    (row: { id: number }) => row.id === variant.id,
  );

  if (!matchingVariant) {
    throw new Error('GET /gyms/:id/exercise-variants did not return variant');
  }

  if (matchingVariant.exerciseName !== 'Barbell Bench Press') {
    throw new Error('Gym variants response did not include exerciseName');
  }

  console.log('Manage gyms verification passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

export {};

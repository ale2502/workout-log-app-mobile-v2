const DEFAULT_GYM_NAME = 'City Fitness Newmarket';
const DEFAULT_VARIANT_LABEL = 'Default machine';

export const config = { transaction: false };

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = async function (knex) {
  await knex.raw('PRAGMA foreign_keys = OFF');

  await knex.schema.createTable('gyms', (table) => {
    table.increments('id');
    table.string('name').notNullable().unique();
  });

  await knex.schema.createTable('exercise_variants', (table) => {
    table.increments('id');
    table.integer('exercise_id').references('exercises.id').notNullable();
    table.integer('gym_id').references('gyms.id').notNullable();
    table.string('label').notNullable();
    table.unique(['exercise_id', 'gym_id', 'label']);
  });

  await knex('gyms').insert({ id: 1, name: DEFAULT_GYM_NAME });

  await knex.schema.alterTable('workouts', (table) => {
    table.integer('gym_id').references('gyms.id');
  });

  await knex.schema.alterTable('sets', (table) => {
    table.integer('exercise_variant_id').references('exercise_variants.id');
  });

  await knex('workouts').update({ gym_id: 1 });

  const exerciseRows = await knex('sets')
    .distinct('exercise_id as exerciseId')
    .whereNotNull('exercise_id');

  for (const row of exerciseRows) {
    const [variant] = await knex('exercise_variants')
      .insert({
        exercise_id: row.exerciseId,
        gym_id: 1,
        label: DEFAULT_VARIANT_LABEL,
      })
      .returning(['id']);

    await knex('sets')
      .where('exercise_id', row.exerciseId)
      .update({ exercise_variant_id: variant.id });
  }

  await knex.raw('PRAGMA foreign_keys = ON');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = async function (knex) {
  await knex.raw('PRAGMA foreign_keys = OFF');

  await knex.schema.alterTable('sets', (table) => {
    table.dropColumn('exercise_variant_id');
  });

  await knex.schema.alterTable('workouts', (table) => {
    table.dropColumn('gym_id');
  });

  await knex.schema.dropTable('exercise_variants');
  await knex.schema.dropTable('gyms');

  await knex.raw('PRAGMA foreign_keys = ON');
};

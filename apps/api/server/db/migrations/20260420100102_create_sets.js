/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
  return knex.schema.createTable('sets', (table) => {
    table.increments('id');
    table.integer('exercise_id');
    table.integer('workout_id');
    table.integer('set_number');
    table.integer('reps');
    table.decimal('load');
    table.decimal('rir');
    table.string('note');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function (knex) {
  return knex.schema.dropTable('sets');
};

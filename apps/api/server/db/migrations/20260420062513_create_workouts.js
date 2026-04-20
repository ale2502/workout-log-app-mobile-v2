/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
  return knex.schema.createTable('workouts', (table) => {
    table.increments('id');
    // Defaults to today; user can override when logging a past workout
    table.date('performed_on').defaultTo(knex.fn.now());
    // DB automatically records when the row was inserted
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function (knex) {
  return knex.schema.dropTable('workouts');
};

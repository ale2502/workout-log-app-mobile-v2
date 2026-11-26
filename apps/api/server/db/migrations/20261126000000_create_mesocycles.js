/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
  return knex.schema.createTable('mesocycles', (table) => {
    table.increments('id');
    // Always a Monday (validated by the API, not the database)
    table.date('start_date').notNullable();
    table.integer('training_weeks').notNullable();
    table.integer('deload_weeks').notNullable().defaultTo(1);
    table.integer('start_rir').notNullable().defaultTo(3);
    table.integer('end_rir').notNullable().defaultTo(0);
    // Set only when a block is ended early; natural completion is computed from dates
    table.date('ended_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function (knex) {
  return knex.schema.dropTable('mesocycles');
};

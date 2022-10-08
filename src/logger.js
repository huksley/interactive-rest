/**
 * @type VerboseConsole
 */
export const logger = console;
/* eslint-disable @typescript-eslint/no-empty-function */
logger.verbose = process.env.LOG_VERBOSE === "1" ? logger.info : () => {};

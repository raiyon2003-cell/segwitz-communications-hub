export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export function actionError(error: unknown): ActionResult<never> {
  if (error instanceof Error) {
    return { success: false, error: error.message };
  }
  return { success: false, error: "An unexpected error occurred" };
}

export function actionSuccess<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

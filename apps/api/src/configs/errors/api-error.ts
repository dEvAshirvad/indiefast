type AppErrorInput = {
  code: string;
  status: number;
  message: string;
};

export class AppError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(input: AppErrorInput) {
    super(input.message);
    this.name = "AppError";
    this.code = input.code;
    this.status = input.status;
  }
}

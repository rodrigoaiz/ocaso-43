/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    comisionUser?: {
      id: string;
      username: string;
      activo: boolean;
      created_at: string;
    };
  }
}

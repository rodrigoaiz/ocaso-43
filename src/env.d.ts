/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    comisionUser?: {
      id: string;
      username: string;
      rol: 'votante' | 'observador';
      activo: boolean;
      created_at: string;
    };
  }
}

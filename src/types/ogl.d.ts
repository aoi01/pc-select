declare module 'ogl' {
  export class Renderer {
    constructor(options?: Record<string, unknown>)
    gl: any
    setSize(width: number, height: number): void
    render(options: { scene: any }): void
  }
  export class Program {
    constructor(gl: any, options: any)
    uniforms: Record<string, { value: any }>
  }
  export class Mesh {
    constructor(gl: any, options: any)
  }
  export class Color {
    constructor(r?: number, g?: number, b?: number)
  }
  export class Triangle {
    constructor(gl: any)
  }
}

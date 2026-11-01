'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';

import './Lightfall.css';

const MAX_COLORS = 8;
const BLOOM_LEVELS = 4;

export interface LightfallProps {
  colors?: string[];
  backgroundColor?: string;
  speed?: number;
  streakCount?: number;
  streakWidth?: number;
  streakLength?: number;
  glow?: number;
  density?: number;
  twinkle?: number;
  zoom?: number;
  backgroundGlow?: number;
  headGlow?: number;
  depth?: number;
  bloom?: number;
  opacity?: number;
  mouseInteraction?: boolean;
  mouseStrength?: number;
  mouseRadius?: number;
  mouseDampening?: number;
  lens?: number;
  holdToWarp?: boolean;
  intro?: boolean;
  fade?: number;
  lightMode?: boolean;
  mixBlendMode?: CSSProperties['mixBlendMode'];
  paused?: boolean;
  dpr?: number;
  className?: string;
  style?: CSSProperties;
}

interface Settings {
  colors: string[];
  backgroundColor: string;
  speed: number;
  streakCount: number;
  streakWidth: number;
  streakLength: number;
  glow: number;
  density: number;
  twinkle: number;
  zoom: number;
  backgroundGlow: number;
  headGlow: number;
  depth: number;
  bloom: number;
  opacity: number;
  mouseInteraction: boolean;
  mouseStrength: number;
  mouseRadius: number;
  mouseDampening: number;
  lens: number;
  holdToWarp: boolean;
  intro: boolean;
  fade: number;
  lightMode: boolean;
  paused: boolean;
  dpr?: number;
}

type Uniforms = Record<string, WebGLUniformLocation | null>;

interface Program {
  program: WebGLProgram;
  uniforms: Uniforms;
}

interface Target {
  texture: WebGLTexture | null;
  framebuffer: WebGLFramebuffer | null;
  width: number;
  height: number;
}

const VERTEX = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const STREAKS = `#version 300 es
precision highp float;
uniform vec2 uView;
uniform float uZoom;
uniform float uPhase;
uniform float uTwinkleClock;
uniform float uRings;
uniform vec3 uColors[8];
uniform int uColorCount;
uniform int uStreakCount;
uniform int uColumns;
uniform float uWidth;
uniform float uTail;
uniform float uTwinkle;
uniform float uHead;
uniform float uDepth;
uniform vec4 uMouse;
uniform vec3 uLens;
uniform float uLightMode;
uniform float uEncode;
out vec4 outColor;

const vec3 CAMERA = vec3(0.0, -0.8888889, -0.2222222);
const float TAU = 6.28318530718;
const float SPACING = 0.005;
const float REACH = 0.32;

uint scramble(uint x) {
  x ^= x >> 16;
  x *= 0x7feb352du;
  x ^= x >> 15;
  x *= 0x846ca68bu;
  x ^= x >> 16;
  return x;
}

float unit(uint x) {
  return float(x & 0xffffu) / 65535.0;
}

float stroke(float d, float w) {
  float s = max(0.75 * w, 0.55);
  return 0.75 * w / s * exp(-0.5 * d * d / (s * s));
}

float orb(float d, float r) {
  float s = max(0.6 * r, 0.7);
  float e = 0.6 * r / s;
  return e * e * exp(-0.5 * d * d / (s * s));
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 screen = (2.0 * frag - uView) / uView.x;
  vec2 p = screen;
  mat2 warp = mat2(1.0);
  if (uLens.z > 0.0) {
    vec2 o = p - uLens.xy;
    float e = uLens.z * exp(-dot(o, o) / (REACH * REACH));
    p -= o * e;
    warp = mat2(1.0 - e) + outerProduct(o, o) * (2.0 * e / (REACH * REACH));
  }

  vec3 dir = vec3(p, uZoom);
  vec3 exits = (1.0 - CAMERA * sign(dir)) / max(abs(dir), vec3(1e-6));
  float u = min(exits.x, min(exits.y, exits.z));
  for (int i = 0; i < 5; i++) {
    vec3 h = CAMERA + u * dir;
    vec3 h2 = h * h;
    u -= (dot(h2, h2) - 1.0) / (4.0 * dot(dir, h2 * h));
  }
  vec3 hit = CAMERA + u * dir;
  vec3 normal = hit * hit * hit;
  float facing = dot(normal, dir);
  vec3 stepX = u * (vec3(1.0, 0.0, 0.0) - dir * (normal.x / facing));
  vec3 stepY = u * (vec3(0.0, 1.0, 0.0) - dir * (normal.y / facing));
  float ring = hit.y * hit.y + hit.z * hit.z;
  float theta = atan(hit.z, hit.y);
  mat2 jacobian = mat2(
    stepX.x,
    (hit.y * stepX.z - hit.z * stepX.y) / ring,
    stepY.x,
    (hit.y * stepY.z - hit.z * stepY.y) / ring
  ) * warp * (2.0 / uView.x);

  vec2 gradX = vec2(jacobian[0][0], jacobian[1][0]);
  vec2 gradTheta = vec2(jacobian[0][1], jacobian[1][1]);
  float scale = max(length(gradX), 1e-8);
  float det = max(abs(gradX.x * gradTheta.y - gradX.y * gradTheta.x), 1e-12);
  float along = scale / det;
  float skew = dot(gradX, gradTheta) / det;
  float spacing = SPACING / scale;
  float detail = smoothstep(1.6, 3.2, spacing);
  if (detail <= 0.0) {
    outColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  float halfWidth = min(uWidth / scale, 0.2 * spacing);
  float headRadius = min(2.0 * uWidth / scale, 0.35 * spacing);
  float headReach = 4.0 * max(0.6 * headRadius, 0.7);
  float edge = uColumns > 1 ? 1.0 : 0.5;
  float period = TAU / uRings;
  float fog = exp(-max(u * length(dir) - 0.6, 0.0) * 1.6 * uDepth);

  float boost = 1.0;
  if (uMouse.z > 0.0) {
    vec2 m = screen - uMouse.xy;
    boost += 2.0 * uMouse.z * exp(-dot(m, m) / max(uMouse.w * uMouse.w, 1e-4));
  }

  int count = max(uColorCount, 1);
  vec3 total = vec3(0.0);
  for (int layer = 0; layer < 16; layer++) {
    if (layer >= uStreakCount) break;
    float x = hit.x + float(layer) * SPACING / 8.0;
    float nearest = floor(x / SPACING + 0.5);
    float side = x >= nearest * SPACING ? 1.0 : -1.0;
    for (int k = 0; k < 2; k++) {
      if (k >= uColumns) break;
      float column = nearest + side * float(k);
      float across = (x - column * SPACING) / scale;
      uint seed = scramble(uint(int(column) + 65536) + uint(layer) * 0x9e3779b9u);
      uint next = scramble(seed);
      float hue = unit(seed >> 16);
      float delta = theta - uPhase * (1.0 + floor(unit(seed) * 16.0) / 16.0) - unit(next) * period;
      delta -= period * floor(delta / period + 0.5);
      float ahead = delta * along - across * skew;
      if (abs(ahead) > headReach && (delta > 0.0 || -delta * uTail > 3.2)) continue;
      float behind = max(-delta, 0.0);
      float fall = exp(-uTail * behind) * (1.0 - smoothstep(0.5, 0.95, behind / (0.5 * period)));
      fall *= 1.0 - smoothstep(1.2, 3.2, uTail * behind);
      float reach = length(vec2(across, ahead));
      float trail = stroke(ahead > 0.0 ? reach : abs(across), halfWidth * mix(0.4, 1.0, fall)) * fall;
      float glint = orb(reach, headRadius) * mix(3.0, 1.8, uLightMode);
      float weight = mix(1.5, 1.0 + sin(uTwinkleClock + 7.0 * hue + 4.0), uTwinkle);
      weight *= 1.0 - smoothstep(0.72 * edge, edge, abs(across) / spacing);
      vec3 color = uColors[min(int(hue * float(count)), count - 1)];
      vec3 hot = mix(color, vec3(1.0), uHead * (1.0 - uLightMode));
      total += (trail * color + glint * hot) * weight;
    }
  }

  outColor = vec4(total * fog * boost * detail * uEncode, 1.0);
}`;

const DOWNSAMPLE = `#version 300 es
precision highp float;
uniform sampler2D uSource;
uniform vec2 uTarget;
uniform vec2 uTexel;
uniform float uLimit;
out vec4 outColor;

void main() {
  vec2 uv = gl_FragCoord.xy / uTarget;
  vec3 color = texture(uSource, uv - uTexel).rgb;
  color += texture(uSource, uv + uTexel).rgb;
  color += texture(uSource, uv + vec2(uTexel.x, -uTexel.y)).rgb;
  color += texture(uSource, uv + vec2(-uTexel.x, uTexel.y)).rgb;
  outColor = vec4(min(color * 0.25, vec3(uLimit)), 1.0);
}`;

const BLUR = `#version 300 es
precision highp float;
uniform sampler2D uSource;
uniform vec2 uTarget;
uniform vec2 uStep;
out vec4 outColor;

void main() {
  vec2 uv = gl_FragCoord.xy / uTarget;
  vec3 color = texture(uSource, uv).rgb * 0.181862;
  color += (texture(uSource, uv + uStep * 1.423135).rgb + texture(uSource, uv - uStep * 1.423135).rgb) * 0.284316;
  color += (texture(uSource, uv + uStep * 3.326702).rgb + texture(uSource, uv - uStep * 3.326702).rgb) * 0.106598;
  color += (texture(uSource, uv + uStep * 5.242989).rgb + texture(uSource, uv - uStep * 5.242989).rgb) * 0.018156;
  outColor = vec4(color, 1.0);
}`;

const COMPOSITE = `#version 300 es
precision highp float;
uniform sampler2D uScene;
uniform sampler2D uBloom0;
uniform sampler2D uBloom1;
uniform sampler2D uBloom2;
uniform sampler2D uBloom3;
uniform vec2 uView;
uniform float uDecode;
uniform float uGlow;
uniform float uBloom;
uniform float uPresence;
uniform float uOpacity;
uniform float uFade;
uniform float uLightMode;
uniform vec3 uTopColor;
uniform float uTopGlow;
out vec4 outColor;

float smootherstep01(float t) {
  t = clamp(t, 0.0, 1.0);
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uView;
  vec3 light = texelFetch(uScene, ivec2(gl_FragCoord.xy), 0).rgb;
  if (uBloom > 0.0) {
    vec3 halo = texture(uBloom0, uv).rgb * 0.42;
    halo += texture(uBloom1, uv).rgb * 0.3;
    halo += texture(uBloom2, uv).rgb * 0.18;
    halo += texture(uBloom3, uv).rgb * 0.1;
    light += halo * uBloom * (uLightMode > 0.5 ? 0.2 : 1.0);
  }
  light *= uDecode * uGlow * uPresence;

  if (uLightMode < 0.5 && uTopGlow > 0.0) {
    float aspect = uView.x / uView.y;
    vec2 q = vec2((uv.x - 0.5) * aspect, 1.04 - uv.y);
    float spread = 0.34 * max(aspect, 0.75);
    float core = exp(-q.x * q.x / (spread * spread) - q.y * q.y / 0.06);
    float halo = exp(-q.x * q.x / (3.6 * spread * spread) - q.y * q.y / 0.18);
    light += uTopColor * uTopGlow * (core * 0.85 + halo * 0.3) * uPresence;
  }

  vec3 lit = max(light, 0.0);
  vec3 mapped = sqrt(1.0 - exp(-1.3 * lit * lit / (lit + 0.025)));
  float peak = max(mapped.r, max(mapped.g, mapped.b));

  float mask = uOpacity;
  float edge = uFade * 0.5;
  if (edge > 0.0) {
    mask *= smootherstep01(uv.x / edge) * smootherstep01((1.0 - uv.x) / edge);
    mask *= smootherstep01(uv.y / edge) * smootherstep01((1.0 - uv.y) / edge);
  }
  float grain = (fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) - 0.5) / 255.0;

  if (uLightMode > 0.5) {
    float coverage = clamp(smoothstep(0.0, 0.5, peak) * mask * 0.94 + grain, 0.0, 1.0);
    vec3 chroma = sqrt(clamp(lit / max(max(lit.r, max(lit.g, lit.b)), 1e-6), 0.0, 1.0));
    chroma = pow(chroma, vec3(1.35));
    chroma /= max(max(chroma.r, max(chroma.g, chroma.b)), 1e-4);
    float saturation = 1.0 - min(chroma.r, min(chroma.g, chroma.b));
    chroma = mix(vec3(0.3), chroma, smoothstep(0.08, 0.35, saturation));
    outColor = vec4(chroma * coverage, coverage);
  } else {
    vec3 color = clamp(mapped + grain, 0.0, 1.0) * mask;
    outColor = vec4(color, max(color.r, max(color.g, color.b)));
  }
}`;

const INTRO_SECONDS = 2.6;
const WARP_SPEED = 9;
const TAU = Math.PI * 2;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const compile = (gl: WebGL2RenderingContext, type: number, source: string) => {
  try {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
    const log = gl.getShaderInfoLog(shader);
    if (log) console.warn('[Lightfall] Shader compile warning/error:', log);
    gl.deleteShader(shader);
    return null;
  } catch {
    return null;
  }
};

const link = (gl: WebGL2RenderingContext, fragmentSource: string): Program | null => {
  try {
    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) return null;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.bindAttribLocation(program, 0, 'aPosition');
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return null;
    }
    const uniforms: Uniforms = {};
    const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < count; i++) {
      const info = gl.getActiveUniform(program, i);
      if (info) uniforms[info.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(program, info.name);
    }
    return { program, uniforms };
  } catch {
    return null;
  }
};

const Lightfall = ({
  colors = ['#9781c7'],
  backgroundColor = '#0A0A0B',
  speed = 0.3,
  streakCount = 2,
  streakWidth = 0.5,
  streakLength = 1.5,
  glow = 1.7,
  density = 0.6,
  twinkle = 1,
  zoom = 2.7,
  backgroundGlow = 0,
  headGlow = 0.25,
  depth = 0.6,
  bloom = 0.5,
  opacity = 0.65,
  mouseInteraction = true,
  mouseStrength = 0.2,
  mouseRadius = 0.15,
  mouseDampening = 0.15,
  lens = 0.15,
  holdToWarp = true,
  intro = true,
  fade = 0,
  lightMode = false,
  mixBlendMode,
  paused = false,
  dpr,
  className = '',
  style
}: LightfallProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const settingsRef = useRef<Settings>({
    colors: ['#9781c7'],
    backgroundColor: '#0A0A0B',
    speed,
    streakCount: 2,
    streakWidth: 0.5,
    streakLength: 1.5,
    glow: 1.7,
    density: 0.6,
    twinkle: 1,
    zoom: 2.7,
    backgroundGlow: 0,
    headGlow: 0.25,
    depth: 0.6,
    bloom: 0.5,
    opacity: 0.65,
    mouseInteraction: true,
    mouseStrength: 0.2,
    mouseRadius: 0.15,
    mouseDampening: 0.15,
    lens: 0.15,
    holdToWarp: true,
    intro: true,
    fade: 0,
    lightMode: false,
    paused: false,
    dpr
  });
  const [generation, setGeneration] = useState(0);

  settingsRef.current = {
    colors: (Array.isArray(colors) && colors.length ? colors : ['#ffffff']).slice(0, MAX_COLORS).map(String),
    backgroundColor: String(backgroundColor),
    speed,
    streakCount: Math.round(clamp(streakCount, 1, 16)),
    streakWidth: Math.max(0.05, streakWidth),
    streakLength: Math.max(0.05, streakLength),
    glow: Math.max(0, glow),
    density,
    twinkle: clamp(twinkle, 0, 1),
    zoom: Math.max(0.1, zoom),
    backgroundGlow: Math.max(0, backgroundGlow),
    headGlow: clamp(headGlow, 0, 1),
    depth: Math.max(0, depth),
    bloom: Math.max(0, bloom),
    opacity: clamp(opacity, 0, 1),
    mouseInteraction,
    mouseStrength: Math.max(0, mouseStrength),
    mouseRadius: Math.max(0.01, mouseRadius),
    mouseDampening: Math.max(0, mouseDampening),
    lens: clamp(lens, 0, 1),
    holdToWarp,
    intro,
    fade: clamp(fade, 0, 1),
    lightMode,
    paused,
    dpr
  };

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return undefined;

    let gl: WebGL2RenderingContext | null = null;
    try {
      gl = canvas.getContext('webgl2', {
        alpha: true,
        premultipliedAlpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: 'high-performance'
      });
    } catch {
      gl = null;
    }

    if (!gl) return undefined;

    const floatTargets = !!gl.getExtension('EXT_color_buffer_float');
    const streakProgram = link(gl, STREAKS);
    const downProgram = link(gl, DOWNSAMPLE);
    const blurProgram = link(gl, BLUR);
    const compositeProgram = link(gl, COMPOSITE);
    if (!streakProgram || !downProgram || !blurProgram || !compositeProgram) return undefined;

    const onContextLost = (event: Event) => {
      event.preventDefault();
    };
    const onContextRestored = () => setGeneration(value => value + 1);
    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);

    const buffer = gl.createBuffer();
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const format = floatTargets ? gl.RGBA16F : gl.RGBA8;
    const encode = floatTargets ? 1 : 0.25;
    const createTarget = (): Target => ({ texture: null, framebuffer: gl?.createFramebuffer() ?? null, width: 0, height: 0 });
    const scene = createTarget();
    const levels = Array.from({ length: BLOOM_LEVELS }, () => [createTarget(), createTarget()]);

    const allocate = (target: Target, width: number, height: number) => {
      if (!gl) return;
      if (target.texture && target.width === width && target.height === height) return;
      if (target.texture) gl.deleteTexture(target.texture);
      target.texture = gl.createTexture();
      target.width = width;
      target.height = height;
      gl.bindTexture(gl.TEXTURE_2D, target.texture);
      gl.texStorage2D(gl.TEXTURE_2D, 1, format, width, height);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target.texture, 0);
    };

    const pass = (target: Target | null, program: Program) => {
      if (!gl) return {};
      gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.framebuffer : null);
      gl.viewport(0, 0, target ? target.width : canvas.width, target ? target.height : canvas.height);
      gl.useProgram(program.program);
      return program.uniforms;
    };

    const bind = (unit: number, texture: WebGLTexture | null) => {
      if (!gl) return;
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, texture);
    };

    // Safe uniform helpers that never throw if a uniform is absent/optimized out
    const u1f = (loc: WebGLUniformLocation | null | undefined, v: number) => { if (gl && loc) gl.uniform1f(loc, v); };
    const u1i = (loc: WebGLUniformLocation | null | undefined, v: number) => { if (gl && loc) gl.uniform1i(loc, v); };
    const u2f = (loc: WebGLUniformLocation | null | undefined, x: number, y: number) => { if (gl && loc) gl.uniform2f(loc, x, y); };
    const u3f = (loc: WebGLUniformLocation | null | undefined, x: number, y: number, z: number) => { if (gl && loc) gl.uniform3f(loc, x, y, z); };
    const u4f = (loc: WebGLUniformLocation | null | undefined, x: number, y: number, z: number, w: number) => { if (gl && loc) gl.uniform4f(loc, x, y, z, w); };
    const u3fv = (loc: WebGLUniformLocation | null | undefined, v: Float32Array | number[]) => { if (gl && loc) gl.uniform3fv(loc, v); };

    const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    const colorCache = new Map<string, number[]>();
    const toRgb = (value: string): number[] => {
      if (colorCache.has(value)) return colorCache.get(value) as number[];
      let rgb = [1, 1, 1];
      if (probe) {
        probe.clearRect(0, 0, 1, 1);
        probe.fillStyle = '#ffffff';
        probe.fillStyle = value;
        probe.fillRect(0, 0, 1, 1);
        const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
        rgb = [r / 255, g / 255, b / 255];
      }
      colorCache.set(value, rgb);
      return rgb;
    };
    const toLinear = (value: string) => toRgb(value).map(channel => channel * channel);

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const palette = new Float32Array(MAX_COLORS * 3);
    const pointer = { x: 0, y: 0, inside: false, held: false };
    const state = {
      travel: 0,
      intro: settingsRef.current.intro && !reduce ? 0 : 1,
      mouseX: 0,
      mouseY: 0,
      lensX: 0,
      lensY: 0,
      touch: 0,
      warp: 0
    };
    let raf = 0;
    let last = 0;
    let visible = true;

    const render = () => {
      if (!gl) return;
      try {
        const s = settingsRef.current;
        const width = canvas.width;
        const height = canvas.height;
        const cssWidth = Math.max(1, container.clientWidth);
        const cssHeight = Math.max(1, container.clientHeight);
        gl.bindVertexArray(vao);
        allocate(scene, width, height);
        levels.forEach((pair, index) => {
          const levelWidth = Math.max(1, Math.round(cssWidth / 2 ** (index + 1)));
          const levelHeight = Math.max(1, Math.round(cssHeight / 2 ** (index + 1)));
          allocate(pair[0], levelWidth, levelHeight);
          allocate(pair[1], levelWidth, levelHeight);
        });

        const intro = state.intro;
        const presence = Math.min(1, intro * 2.2);
        const stretch = 1 + 5 * Math.pow(1 - intro, 2) + 2.5 * state.warp;
        const rings = Math.max(1, Math.floor(TAU * Math.max(s.density, 0.05) + 0.5));
        const period = TAU / rings;
        const clock = 9 + state.travel;

        const list = s.colors.map(toLinear);
        palette.fill(0);
        for (let i = 0; i < MAX_COLORS; i++) palette.set(list[Math.min(i, list.length - 1)], i * 3);

        const toScreenX = (value: number) => (2 * value - width) / width;
        const toScreenY = (value: number) => (2 * value - height) / width;

        const r = pass(scene, streakProgram);
        u2f(r.uView, width, height);
        u1f(r.uZoom, s.zoom);
        u1f(r.uPhase, clock % (16 * period));
        u1f(r.uTwinkleClock, clock % TAU);
        u1f(r.uRings, rings);
        u3fv(r.uColors, palette);
        u1i(r.uColorCount, list.length);
        u1i(r.uStreakCount, s.streakCount);
        u1i(r.uColumns, s.streakWidth > 1 ? 2 : 1);
        u1f(r.uWidth, 5e-4 * s.streakWidth);
        u1f(r.uTail, 19 / (s.streakLength * stretch));
        u1f(r.uTwinkle, s.twinkle);
        u1f(r.uHead, s.headGlow);
        u1f(r.uDepth, s.depth);
        u4f(
          r.uMouse,
          toScreenX(state.mouseX),
          toScreenY(state.mouseY),
          s.mouseInteraction ? s.mouseStrength * state.touch : 0,
          s.mouseRadius
        );
        u3f(
          r.uLens,
          toScreenX(state.lensX),
          toScreenY(state.lensY),
          s.mouseInteraction ? 0.5 * s.lens * state.touch : 0
        );
        u1f(r.uLightMode, s.lightMode ? 1 : 0);
        u1f(r.uEncode, encode);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        if (s.bloom > 0) {
          let source = scene;
          levels.forEach(([front, back]) => {
            const d = pass(front, downProgram);
            bind(0, source.texture);
            u1i(d.uSource, 0);
            u2f(d.uTarget, front.width, front.height);
            u2f(d.uTexel, 1 / source.width, 1 / source.height);
            u1f(d.uLimit, 4 * encode);
            gl?.drawArrays(gl.TRIANGLES, 0, 3);

            let b = pass(back, blurProgram);
            bind(0, front.texture);
            u1i(b.uSource, 0);
            u2f(b.uTarget, back.width, back.height);
            u2f(b.uStep, 1 / front.width, 0);
            gl?.drawArrays(gl.TRIANGLES, 0, 3);

            b = pass(front, blurProgram);
            bind(0, back.texture);
            u1i(b.uSource, 0);
            u2f(b.uTarget, front.width, front.height);
            u2f(b.uStep, 0, 1 / back.height);
            gl?.drawArrays(gl.TRIANGLES, 0, 3);
            source = front;
          });
        }

        const c = pass(null, compositeProgram);
        bind(0, scene.texture);
        u1i(c.uScene, 0);
        levels.forEach(([front], index) => {
          bind(index + 1, front.texture);
          u1i(c[`uBloom${index}`], index + 1);
        });
        u2f(c.uView, width, height);
        u1f(c.uDecode, 1 / encode);
        u1f(c.uGlow, s.glow);
        u1f(c.uBloom, s.bloom);
        u1f(c.uPresence, presence);
        u1f(c.uOpacity, s.opacity);
        u1f(c.uFade, s.fade);
        u1f(c.uLightMode, s.lightMode ? 1 : 0);
        u3fv(c.uTopColor, toLinear(s.backgroundColor));
        u1f(c.uTopGlow, s.backgroundGlow);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        for (let unit = BLOOM_LEVELS; unit >= 0; unit--) bind(unit, null);
      } catch (err) {
        console.warn('[Lightfall] render warning:', err);
      }
    };

    const frame = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      const s = settingsRef.current;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      if (!s.intro || reduce) state.intro = 1;
      else if (state.intro < 1) state.intro = Math.min(1, state.intro + dt / INTRO_SECONDS);

      const holding = s.holdToWarp && pointer.held && pointer.inside && !reduce;
      state.warp += ((holding ? 1 : 0) - state.warp) * (1 - Math.exp(-dt * (holding ? 2.2 : 1.6)));
      const rush = WARP_SPEED * Math.pow(1 - state.intro, 2) + 6 * state.warp;
      const running = !s.paused && !reduce;
      if (running) state.travel += dt * 0.1 * s.speed * (1 + rush);

      const ratio = canvas.width / Math.max(1, container.clientWidth);
      const targetX = pointer.x * ratio;
      const targetY = (container.clientHeight - pointer.y) * ratio;
      const engaged = s.mouseInteraction && pointer.inside && !reduce;
      if (engaged && state.touch < 0.01) {
        state.mouseX = targetX;
        state.mouseY = targetY;
        state.lensX = targetX;
        state.lensY = targetY;
      }
      const follow = s.mouseDampening > 0 ? 1 - Math.exp(-dt / s.mouseDampening) : 1;
      state.mouseX += (targetX - state.mouseX) * follow;
      state.mouseY += (targetY - state.mouseY) * follow;
      const lensFollow = 1 - Math.exp(-dt * 6);
      state.lensX += (targetX - state.lensX) * lensFollow;
      state.lensY += (targetY - state.lensY) * lensFollow;
      state.touch += ((engaged ? 1 : 0) - state.touch) * (1 - Math.exp(-dt * (engaged ? 4 : 2)));

      render();

      const settling = state.intro < 1 || state.warp > 0.001 || Math.abs((engaged ? 1 : 0) - state.touch) > 0.002;
      if ((running && s.speed !== 0) || settling) raf = requestAnimationFrame(frame);
      else last = 0;
    };

    const wake = () => {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
    };

    const resize = () => {
      const s = settingsRef.current;
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      const ratio = Math.min(s.dpr || window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      if (!raf) render();
      wake();
    };

    const locate = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      return { x, y, inside: x >= 0 && y >= 0 && x <= rect.width && y <= rect.height };
    };

    const onPointerMove = (event: PointerEvent) => {
      const point = locate(event);
      pointer.x = point.x;
      pointer.y = point.y;
      pointer.inside = point.inside;
      wake();
    };

    const onPointerDown = (event: PointerEvent) => {
      const point = locate(event);
      if (!point.inside) return;
      pointer.x = point.x;
      pointer.y = point.y;
      pointer.inside = true;
      pointer.held = true;
      wake();
    };

    const onPointerUp = () => {
      pointer.held = false;
      wake();
    };

    const onPointerLeave = () => {
      pointer.inside = false;
      pointer.held = false;
      wake();
    };

    const onVisibility = () => {
      last = 0;
      wake();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    const intersection = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible) {
        last = 0;
        wake();
      }
    });
    intersection.observe(container);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', onPointerUp, { passive: true });
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('visibilitychange', onVisibility);
    resize();

    let lastDpr = settingsRef.current.dpr;
    wakeRef.current = () => {
      const s = settingsRef.current;
      if (s.dpr !== lastDpr) {
        lastDpr = s.dpr;
        resize();
        return;
      }
      if (!raf) render();
      wake();
    };

    return () => {
      cancelAnimationFrame(raf);
      wakeRef.current = null;
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      try {
        [scene, ...levels.flat()].forEach(target => {
          if (target.texture && gl) gl.deleteTexture(target.texture);
          if (target.framebuffer && gl) gl.deleteFramebuffer(target.framebuffer);
        });
        [streakProgram, downProgram, blurProgram, compositeProgram].forEach(item => {
          if (gl) gl.deleteProgram(item.program);
        });
        if (buffer && gl) gl.deleteBuffer(buffer);
        if (vao && gl) gl.deleteVertexArray(vao);
      } catch {
        /* ignore */
      }
    };
  }, [generation]);

  useEffect(() => {
    wakeRef.current?.();
  });

  return (
    <div
      ref={containerRef}
      className={`lightfall-container${className ? ` ${className}` : ''}`}
      style={{ ...(mixBlendMode ? { mixBlendMode } : null), ...style }}
    >
      <canvas ref={canvasRef} className="lightfall-canvas" aria-hidden="true" />
    </div>
  );
};

export default Lightfall;

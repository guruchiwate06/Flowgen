import React, { useRef, useState, useEffect } from 'react';
import { hexToRgb, getAnchorAndDir } from '../constants';

const LightRays = ({
  raysOrigin = 'top-center',
  raysColor = '#ffffff',
  raysSpeed = 1,
  lightSpread = 1,
  rayLength = 2,
  pulsating = false,
  fadeDistance = 1.0,
  saturation = 1.0,
  followMouse = true,
  mouseInfluence = 0.1,
  noiseAmount = 0.0,
  distortion = 0.0,
  className = '',
  isLibReady = false
}) => {
  const containerRef = useRef(null);
  const uniformsRef = useRef(null);
  const rendererRef = useRef(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const smoothMouseRef = useRef({ x: 0.5, y: 0.5 });
  const animationIdRef = useRef(null);
  const meshRef = useRef(null);
  const cleanupFunctionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const observerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    observerRef.current = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    observerRef.current.observe(containerRef.current);
    return () => observerRef.current?.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || !isLibReady || !containerRef.current || !window.ogl) return;

    const { Renderer, Program, Triangle, Mesh } = window.ogl;

    const initializeWebGL = () => {
      try {
        const renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio, 2), alpha: true });
        rendererRef.current = renderer;
        const gl = renderer.gl;
        
        while(containerRef.current.firstChild) containerRef.current.removeChild(containerRef.current.firstChild);
        containerRef.current.appendChild(gl.canvas);
        gl.canvas.style.width = '100%';
        gl.canvas.style.height = '100%';

        const vert = `attribute vec2 position;varying vec2 vUv;void main(){vUv=position*0.5+0.5;gl_Position=vec4(position,0.0,1.0);}`;
        const frag = `precision highp float;uniform float iTime;uniform vec2 iResolution;uniform vec2 rayPos;uniform vec2 rayDir;uniform vec3 raysColor;uniform float raysSpeed;uniform float lightSpread;uniform float rayLength;uniform float pulsating;uniform float fadeDistance;uniform float saturation;uniform vec2 mousePos;uniform float mouseInfluence;uniform float noiseAmount;uniform float distortion;varying vec2 vUv;float noise(vec2 st){return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123);}float rayStrength(vec2 raySource,vec2 rayRefDirection,vec2 coord,float seedA,float seedB,float speed){vec2 sourceToCoord=coord-raySource;vec2 dirNorm=normalize(sourceToCoord);float cosAngle=dot(dirNorm,rayRefDirection);float distortedAngle=cosAngle+distortion*sin(iTime*2.0+length(sourceToCoord)*0.01)*0.2;float spreadFactor=pow(max(distortedAngle,0.0),1.0/max(lightSpread,0.001));float distance=length(sourceToCoord);float maxDistance=iResolution.x*rayLength;float lengthFalloff=clamp((maxDistance-distance)/maxDistance,0.0,1.0);float fadeFalloff=clamp((iResolution.x*fadeDistance-distance)/(iResolution.x*fadeDistance),0.5,1.0);float pulse=pulsating>0.5?(0.8+0.2*sin(iTime*speed*3.0)):1.0;float baseStrength=clamp((0.45+0.15*sin(distortedAngle*seedA+iTime*speed))+(0.3+0.2*cos(-distortedAngle*seedB+iTime*speed)),0.0,1.0);return baseStrength*lengthFalloff*fadeFalloff*spreadFactor*pulse;}void mainImage(out vec4 fragColor,in vec2 fragCoord){vec2 coord=vec2(fragCoord.x,iResolution.y-fragCoord.y);vec2 finalRayDir=rayDir;if(mouseInfluence>0.0){vec2 mouseScreenPos=mousePos*iResolution.xy;vec2 mouseDirection=normalize(mouseScreenPos-rayPos);finalRayDir=normalize(mix(rayDir,mouseDirection,mouseInfluence));}vec4 rays1=vec4(1.0)*rayStrength(rayPos,finalRayDir,coord,36.2214,21.11349,1.5*raysSpeed);vec4 rays2=vec4(1.0)*rayStrength(rayPos,finalRayDir,coord,22.3991,18.0234,1.1*raysSpeed);fragColor=rays1*0.5+rays2*0.4;if(noiseAmount>0.0){float n=noise(coord*0.01+iTime*0.1);fragColor.rgb*=(1.0-noiseAmount+noiseAmount*n);}float brightness=1.0-(coord.y/iResolution.y);fragColor.x*=0.1+brightness*0.8;fragColor.y*=0.3+brightness*0.6;fragColor.z*=0.5+brightness*0.5;if(saturation!=1.0){float gray=dot(fragColor.rgb,vec3(0.299,0.587,0.114));fragColor.rgb=mix(vec3(gray),fragColor.rgb,saturation);}fragColor.rgb*=raysColor;}void main(){vec4 color;mainImage(color,gl_FragCoord.xy);gl_FragColor=color;}`;

        const uniforms = {
          iTime: { value: 0 },
          iResolution: { value: [gl.canvas.width, gl.canvas.height] },
          rayPos: { value: [0, 0] },
          rayDir: { value: [0, 1] },
          raysColor: { value: hexToRgb(raysColor) },
          raysSpeed: { value: raysSpeed },
          lightSpread: { value: lightSpread },
          rayLength: { value: rayLength },
          pulsating: { value: pulsating ? 1.0 : 0.0 },
          fadeDistance: { value: fadeDistance },
          saturation: { value: saturation },
          mousePos: { value: [0.5, 0.5] },
          mouseInfluence: { value: mouseInfluence },
          noiseAmount: { value: noiseAmount },
          distortion: { value: distortion }
        };
        uniformsRef.current = uniforms;

        const geometry = new Triangle(gl);
        const program = new Program(gl, { vertex: vert, fragment: frag, uniforms });
        const mesh = new Mesh(gl, { geometry, program });
        meshRef.current = mesh;

        const updateSize = () => {
          if (!containerRef.current) return;
          const { clientWidth: w, clientHeight: h } = containerRef.current;
          renderer.setSize(w, h);
          uniforms.iResolution.value = [w * renderer.dpr, h * renderer.dpr];
          const { anchor, dir } = getAnchorAndDir(raysOrigin, w * renderer.dpr, h * renderer.dpr);
          uniforms.rayPos.value = anchor;
          uniforms.rayDir.value = dir;
        };

        const loop = (t) => {
          animationIdRef.current = requestAnimationFrame(loop);
          uniforms.iTime.value = t * 0.001;
          if (followMouse) {
            smoothMouseRef.current.x += (mouseRef.current.x - smoothMouseRef.current.x) * 0.1;
            smoothMouseRef.current.y += (mouseRef.current.y - smoothMouseRef.current.y) * 0.1;
            uniforms.mousePos.value = [smoothMouseRef.current.x, smoothMouseRef.current.y];
          }
          renderer.render({ scene: mesh });
        };

        window.addEventListener('resize', updateSize);
        updateSize();
        animationIdRef.current = requestAnimationFrame(loop);

        cleanupFunctionRef.current = () => {
          cancelAnimationFrame(animationIdRef.current);
          window.removeEventListener('resize', updateSize);
          if (gl.canvas.parentNode) gl.canvas.parentNode.removeChild(gl.canvas);
        };
      } catch (err) {
        console.error("WebGL Error:", err);
      }
    };

    initializeWebGL();
    return () => cleanupFunctionRef.current?.();
  }, [isVisible, isLibReady, raysOrigin, raysColor, raysSpeed, lightSpread, rayLength, pulsating, fadeDistance, saturation, followMouse, mouseInfluence, noiseAmount, distortion]);

  useEffect(() => {
    const handleMove = e => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current = { x: (e.clientX - rect.left) / rect.width, y: 1.0 - (e.clientY - rect.top) / rect.height };
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return <div ref={containerRef} className={`light-rays-container absolute inset-0 pointer-events-none ${className}`} />;
};

export default LightRays;

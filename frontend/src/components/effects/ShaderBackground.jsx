import {useEffect,useRef} from 'react';
// One small WebGL canvas. Static CSS atmosphere remains if WebGL is unavailable.
export default function ShaderBackground(){const ref=useRef(null);useEffect(()=>{
 if(matchMedia('(prefers-reduced-motion: reduce), (max-width: 760px)').matches)return;
 const canvas=ref.current,gl=canvas.getContext('webgl',{alpha:true,antialias:false});if(!gl)return;
 const compile=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);return s;};
 const vertex=compile(gl.VERTEX_SHADER,'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}');
 const fragment=compile(gl.FRAGMENT_SHADER,'precision mediump float;uniform float t;uniform vec2 r;void main(){vec2 uv=gl_FragCoord.xy/r;float v=sin(uv.x*5.+sin(uv.y*4.+t*.07)+t*.03)*.5+.5;float d=1.-distance(uv,vec2(.7,.4));gl_FragColor=vec4(vec3(.025,.12,.15)*v*d,.6);}');
 const program=gl.createProgram();gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))return;gl.useProgram(program);
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const pos=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);const time=gl.getUniformLocation(program,'t'),res=gl.getUniformLocation(program,'r');let frame,last=0;
 const render=now=>{frame=requestAnimationFrame(render);if(document.hidden||now-last<65)return;last=now;canvas.width=Math.min(innerWidth,1000);canvas.height=600;gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(res,canvas.width,canvas.height);gl.uniform1f(time,now/1000);gl.drawArrays(gl.TRIANGLES,0,6);};frame=requestAnimationFrame(render);
 return()=>{cancelAnimationFrame(frame);gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.deleteShader(vertex);gl.deleteShader(fragment);};
 },[]);return <canvas className="shader" ref={ref} aria-hidden="true"/>;}

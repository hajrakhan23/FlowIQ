import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Token, Department } from '../../types';
import { Activity, ShieldAlert, Sparkles, Eye, RotateCw } from 'lucide-react';

interface SpatialQueuePipeline3DProps {
  tokens: Token[];
  selectedDepartment?: Department;
  onSelectToken?: (token: Token) => void;
  className?: string;
}

export const SpatialQueuePipeline3D: React.FC<SpatialQueuePipeline3DProps> = ({
  tokens,
  selectedDepartment,
  onSelectToken,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredToken, setHoveredToken] = useState<Token | null>(null);
  const [isSurgeSimulated, setIsSurgeSimulated] = useState(false);
  const [viewAngle, setViewAngle] = useState<'orbit' | 'front' | 'top'>('orbit');

  const deptTokens = tokens.filter(
    (t) =>
      (!selectedDepartment || t.department_id === selectedDepartment.id) &&
      (t.status === 'waiting' || t.status === 'serving')
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 340;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1118);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 14, 28);
    camera.lookAt(0, 1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Grid helper
    const gridHelper = new THREE.GridHelper(40, 20, 0x1f3b4d, 0x0f202c);
    gridHelper.position.y = -4;
    scene.add(gridHelper);

    // Ambient and Point Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const cyanLight = new THREE.PointLight(0x00f0ff, 2.5, 50);
    cyanLight.position.set(-10, 10, 10);
    scene.add(cyanLight);

    const emeraldLight = new THREE.PointLight(0x00ff88, 2, 50);
    emeraldLight.position.set(10, 8, -5);
    scene.add(emeraldLight);

    const redLight = new THREE.PointLight(0xff3366, 3, 50);
    redLight.position.set(0, 12, 0);
    scene.add(redLight);

    // 3D Curve for the Pipeline Ribbon (Curved spatial arch)
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-14, -2, -6),
      new THREE.Vector3(-7, 2.5, -2),
      new THREE.Vector3(0, 4.2, 0),
      new THREE.Vector3(7, 2.2, 2),
      new THREE.Vector3(14, -2, 5),
    ]);

    // Tube Wireframe Geometry
    const tubeGeometry = new THREE.TubeGeometry(curve, 48, 1.8, 16, false);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const tubeMesh = new THREE.Mesh(tubeGeometry, wireframeMaterial);
    scene.add(tubeMesh);

    // Inner glowing core line
    const points = curve.getPoints(100);
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.7,
      linewidth: 2,
    });
    const lineMesh = new THREE.Line(lineGeo, lineMat);
    scene.add(lineMesh);

    // Token Cubes along the spline
    const tokenMeshes: { mesh: THREE.Mesh; token: Token; baseT: number; speed: number }[] = [];
    const cubeGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);

    const activeTokensList = deptTokens.length > 0 ? deptTokens : tokens.slice(0, 8);

    activeTokensList.forEach((token, idx) => {
      let color = 0x6c8cbf; // Default in queue
      if (token.priority === 'emergency' || token.is_emergency) {
        color = 0xff3366; // Red urgent
      } else if (token.position_in_queue === 0 || token.status === 'serving') {
        color = 0x00f0ff; // Cyan serving
      } else if (token.position_in_queue <= 2) {
        color = 0x00ff88; // Emerald staged
      }

      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.6,
        roughness: 0.2,
        metalness: 0.8,
      });

      const mesh = new THREE.Mesh(cubeGeo, mat);
      const baseT = Math.max(0.05, Math.min(0.95, (idx + 1) / (activeTokensList.length + 1)));
      const pt = curve.getPointAt(baseT);
      mesh.position.copy(pt);
      scene.add(mesh);

      tokenMeshes.push({
        mesh,
        token,
        baseT,
        speed: 0.0008 * (isSurgeSimulated ? 2.5 : 1),
      });
    });

    // Raycaster for mouse interactivity
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(tokenMeshes.map((tm) => tm.mesh));
      if (intersects.length > 0) {
        const hit = tokenMeshes.find((tm) => tm.mesh === intersects[0].object);
        if (hit) {
          setHoveredToken(hit.token);
          container.style.cursor = 'pointer';
          return;
        }
      }
      setHoveredToken(null);
      container.style.cursor = 'grab';
    };

    const onClick = () => {
      if (hoveredToken && onSelectToken) {
        onSelectToken(hoveredToken);
      }
    };

    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('click', onClick);

    // Orbit mouse drag interaction
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onDragMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      scene.rotation.y += deltaX * 0.008;
      scene.rotation.x += deltaY * 0.005;
      scene.rotation.x = Math.max(-0.5, Math.min(0.8, scene.rotation.x));

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onDragMove);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Subtle idle float
      if (!isDragging) {
        scene.rotation.y = Math.sin(elapsedTime * 0.2) * 0.15;
      }

      // Pulse wireframe opacity
      wireframeMaterial.opacity = 0.25 + Math.sin(elapsedTime * 2) * 0.1;

      // Animate cubes along the curve
      tokenMeshes.forEach((tm) => {
        let t = (tm.baseT + elapsedTime * tm.speed) % 1;
        const pt = curve.getPointAt(t);
        tm.mesh.position.copy(pt);
        tm.mesh.rotation.x += 0.015;
        tm.mesh.rotation.y += 0.02;

        // Emergency items pulse scale
        if (tm.token.priority === 'emergency') {
          const scale = 1.2 + Math.sin(elapsedTime * 6) * 0.25;
          tm.mesh.scale.set(scale, scale, scale);
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 340;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('click', onClick);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onDragMove);
      renderer.dispose();
    };
  }, [deptTokens, isSurgeSimulated]);

  return (
    <div
      className={`relative rounded-3xl bg-[#0A1118] border border-[#00F0FF]/30 shadow-2xl overflow-hidden p-5 flex flex-col justify-between ${className}`}
    >
      {/* Header bar matching spatial ops reference */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#00F0FF]/20 z-10">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00F0FF] animate-ping" />
          <h3 className="text-xs sm:text-sm font-black font-mono tracking-widest text-[#00F0FF] uppercase">
            LIVE FLOW PIPELINE • {selectedDepartment?.name || 'ALL CLINICS'}
          </h3>
          <span className="px-2 py-0.5 rounded-md bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] text-[10px] font-black font-mono">
            {deptTokens.length} IN STREAM
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSurgeSimulated(!isSurgeSimulated)}
            className={`px-3 py-1 rounded-xl text-[11px] font-black font-mono tracking-wider flex items-center gap-1.5 border transition-all cursor-pointer ${
              isSurgeSimulated
                ? 'bg-[#FF3366] text-white border-[#FF3366] shadow-lg shadow-[#FF3366]/40 animate-pulse'
                : 'bg-[#101B24] text-[#00F0FF] border-[#00F0FF]/40 hover:bg-[#00F0FF]/20'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            {isSurgeSimulated ? 'SURGE ACTIVE (2.5x)' : 'SIMULATE SURGE'}
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Container */}
      <div className="relative w-full h-[260px] sm:h-[300px] my-2 rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing">
        <div ref={containerRef} className="w-full h-full" />

        {/* Hovered Token Tooltip HUD */}
        {hoveredToken && (
          <div className="absolute top-4 left-4 p-3 rounded-2xl bg-[#0A1118]/95 border border-[#00F0FF] text-white shadow-2xl backdrop-blur-md z-20 space-y-1 animate-in fade-in zoom-in-95 pointer-events-none">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-black font-mono text-[#00F0FF]">
                TOKEN #{hoveredToken.token_number}
              </span>
              {hoveredToken.priority === 'emergency' ? (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-[#FF3366] text-white animate-pulse">
                  EMERGENCY CODE RED
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 font-mono">
                  Pos #{hoveredToken.position_in_queue}
                </span>
              )}
            </div>
            <p className="text-xs font-extrabold text-white">{hoveredToken.patient_name}</p>
            <p className="text-[11px] text-[#00FF88] font-mono">
              Dr. {hoveredToken.doctor_name?.replace(/^Dr\.\s*/, '')} • ~{hoveredToken.estimated_wait_minutes}m wait
            </p>
            {hoveredToken.triage_reason && (
              <p className="text-[10px] text-[#FF3366] font-semibold">
                Reason: {hoveredToken.triage_reason}
              </p>
            )}
          </div>
        )}

        {/* Orbit indicator */}
        <div className="absolute bottom-3 right-3 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest pointer-events-none flex items-center gap-1">
          <RotateCw className="w-3 h-3 text-[#00F0FF]" />
          DRAG TO ORBIT 3D PIPELINE
        </div>
      </div>

      {/* Legend strip matching screenshot */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#00F0FF]/20 text-[10px] sm:text-xs font-mono font-bold text-slate-400 z-10">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5 text-[#00F0FF]">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#00F0FF] shadow-xs shadow-[#00F0FF]" />
            Next Call (Pos 1)
          </span>
          <span className="flex items-center gap-1.5 text-[#00FF88]">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#00FF88] shadow-xs shadow-[#00FF88]" />
            Staged (Pos 2-5)
          </span>
          <span className="flex items-center gap-1.5 text-[#6C8CBF]">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#6C8CBF]" />
            In Queue
          </span>
          <span className="flex items-center gap-1.5 text-[#FF3366]">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#FF3366] animate-pulse shadow-xs shadow-[#FF3366]" />
            Triage / Urgent (Code Red)
          </span>
        </div>

        <span className="text-[10px] text-slate-500 font-mono hidden sm:block">
          SPATIAL TOPOLOGY: SPLINE 01-B
        </span>
      </div>
    </div>
  );
};

<script lang="ts">
  import { onMount } from 'svelte';
  
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null;
  let animationId: number;
  
  let width = 0;
  let height = 0;
  
  const particles: Particle[] = [];
  const PARTICLE_COUNT = typeof window !== 'undefined' && window.innerWidth < 768 ? 40 : 80;
  const MAX_DISTANCE = 120;
  
  let mouse = { x: -1000, y: -1000 };
  
  class Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    
    constructor(w: number, h: number) {
      this.x = Math.random() * w;
      this.y = Math.random() * h;
      this.vx = (Math.random() - 0.5) * 0.5;
      this.vy = (Math.random() - 0.5) * 0.5;
      this.radius = Math.random() * 2 + 1;
    }
    
    update() {
      // Mouse interaction
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 150) {
        const forceDirectionX = dx / distance;
        const forceDirectionY = dy / distance;
        const force = (150 - distance) / 150;
        this.vx -= forceDirectionX * force * 0.05;
        this.vy -= forceDirectionY * force * 0.05;
      }
      
      this.x += this.vx;
      this.y += this.vy;
      
      // Bounce off walls
      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;
      
      // Dampen velocity to prevent going too fast from mouse push
      this.vx *= 0.99;
      this.vy *= 0.99;
      
      // Maintain min speed
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (speed < 0.2) {
        this.vx *= 1.1;
        this.vy *= 1.1;
      }
    }
    
    draw(ctx: CanvasRenderingContext2D) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(14, 165, 233, 0.6)'; // cyber-500
      ctx.fill();
    }
  }
  
  function resize() {
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (parent) {
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = width;
      canvas.height = height;
    }
  }
  
  function init() {
    resize();
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new Particle(width, height));
    }
  }
  
  function animate() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    
    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw(ctx);
      
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < MAX_DISTANCE) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(14, 165, 233, ${0.2 * (1 - distance / MAX_DISTANCE)})`;
          ctx.lineWidth = 1;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
    animationId = requestAnimationFrame(animate);
  }
  
  function handleMouseMove(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  }
  
  function handleMouseLeave() {
    mouse.x = -1000;
    mouse.y = -1000;
  }
  
  onMount(() => {
    ctx = canvas.getContext('2d');
    init();
    animate();
    
    window.addEventListener('resize', resize);
    
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  });
</script>

<canvas 
  bind:this={canvas} 
  class="absolute inset-0 w-full h-full pointer-events-auto"
  onmousemove={handleMouseMove}
  onmouseleave={handleMouseLeave}
></canvas>

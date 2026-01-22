import React, { useEffect, useRef } from 'react';
import styles from '../../pages/Home.module.css';

const StarryBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let stars: Star[] = [];
        const starCount = 400;
        let animationFrameId: number;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', resize);
        resize();

        class Star {
            x: number;
            y: number;
            size: number;
            speed: number;
            opacity: number;
            fadeRate: number;

            constructor() {
                this.x = Math.random() * canvas!.width;
                this.y = Math.random() * canvas!.height;
                this.size = Math.random() * 1.5;
                this.speed = Math.random() * 0.05;
                this.opacity = Math.random();
                this.fadeRate = (Math.random() * 0.02) * (Math.random() < 0.5 ? 1 : -1);
            }

            update() {
                // Twinkle effect
                this.opacity += this.fadeRate;
                if (this.opacity > 1 || this.opacity < 0) {
                    this.fadeRate = -this.fadeRate;
                }

                // Slow movement
                this.y -= this.speed;
                if (this.y < 0) this.y = canvas!.height;
            }

            draw() {
                if (!ctx) return;
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, Math.min(1, this.opacity))})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const init = () => {
            stars = [];
            for (let i = 0; i < starCount; i++) {
                stars.push(new Star());
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            stars.forEach(star => {
                star.update();
                star.draw();
            });
            animationFrameId = requestAnimationFrame(animate);
        };

        init();
        animate();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <>
            <div className={styles.nebula}></div>
            <canvas ref={canvasRef} className={styles.starCanvas}></canvas>
        </>
    );
};

export default StarryBackground;

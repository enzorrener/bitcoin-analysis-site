const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all fade-in elements
document.querySelectorAll('.fade-in').forEach((el) => {
    observer.observe(el);
});

// Add hover effects to stat cards
document.querySelectorAll('.stat-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-8px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0) scale(1)';
    });
});

// Animate stat values on scroll
function animateStatValues() {
    const statValues = document.querySelectorAll('.stat-value');
    statValues.forEach(stat => {
        const text = stat.textContent;
        if (text.includes('$') || text.includes('k')) {
            const number = parseInt(text.replace(/\D/g, ''));
            if (!isNaN(number)) {
                let current = 0;
                const increment = number / 50;
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= number) {
                        current = number;
                        clearInterval(timer);
                    }
                    stat.textContent = text.includes('$') ? 
                        '$' + Math.floor(current) + 'k' : 
                        Math.floor(current) + 'k';
                }, 30);
            }
        }
    });
}

// Trigger animation when stats come into view
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateStatValues();
            statsObserver.disconnect();
        }
    });
});

const heroStats = document.querySelector('.hero-stats');
if (heroStats) {
    statsObserver.observe(heroStats);
}

// Header hide/show on scroll
let lastScrollTop = 0;
const header = document.querySelector('.top-header');

window.addEventListener('scroll', function() {
    let currentScroll = window.pageYOffset || document.documentElement.scrollTop;

    if (currentScroll > lastScrollTop) {
        // Scroll down
        header.style.transform = 'translateY(-100%)';
    } else {
        // Scroll up
        header.style.transform = 'translateY(0)';
    }
    lastScrollTop = currentScroll <= 0 ? 0 : currentScroll; // For Mobile or negative scrolling
});

// Função para calcular posição precisa do gráfico
function scrollToChart() {
    console.log('Tentando ir para o gráfico...');
    
    // Múltiplas tentativas de encontrar o gráfico
    const targets = [
        document.getElementById('grafico-bitcoin'),
        document.querySelector('.chart-section'),
        document.querySelector('.chart-visual'),
        document.querySelector('.chart-icon img')
    ];
    
    let targetElement = null;
    
    for (let target of targets) {
        if (target) {
            targetElement = target;
            console.log('Elemento encontrado:', target.className || target.id);
            break;
        }
    }
    
    if (targetElement) {
        // Calcula posições
        const rect = targetElement.getBoundingClientRect();
        const headerHeight = document.querySelector('.top-header')?.offsetHeight || 80;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Posição final: topo do elemento - altura do header - margem extra
        const targetPosition = rect.top + scrollTop - headerHeight - 30;
        
        console.log('Scrolling para posição:', targetPosition);
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
        
        // Destaque visual
        setTimeout(() => {
            targetElement.style.transition = 'all 0.5s ease';
            targetElement.style.boxShadow = '0 0 25px rgba(255, 165, 0, 0.6)';
            targetElement.style.transform = 'scale(1.02)';
            
            setTimeout(() => {
                targetElement.style.boxShadow = '';
                targetElement.style.transform = 'scale(1)';
            }, 2000);
        }, 500);
        
    } else {
        console.log('Gráfico não encontrado!');
    }
}

function scrollToStrategy() {
    console.log('Tentando ir para estratégias...');
    
    const targets = [
        document.getElementById('estrategias'),
        document.querySelector('.recommendation-grid'),
        document.querySelector('.recommendation-card')
    ];
    
    let targetElement = null;
    
    for (let target of targets) {
        if (target) {
            targetElement = target;
            console.log('Elemento de estratégia encontrado:', target.className || target.id);
            break;
        }
    }
    
    if (targetElement) {
        // Cálculo suave igual ao do gráfico
        const rect = targetElement.getBoundingClientRect();
        const headerHeight = document.querySelector('.top-header')?.offsetHeight || 80;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Mesma lógica suave do gráfico
        const targetPosition = rect.top + scrollTop - headerHeight - 30;
        
        console.log('Scrolling suave para estratégias:', targetPosition);
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
        
        // Efeito visual mais suave
        setTimeout(() => {
            targetElement.style.transition = 'all 0.5s ease';
            targetElement.style.boxShadow = '0 0 20px rgba(34, 197, 94, 0.3)'; // Verde mais suave
            targetElement.style.transform = 'scale(1.005)'; // Escala bem sutil
            
            setTimeout(() => {
                targetElement.style.boxShadow = '';
                targetElement.style.transform = 'scale(1)';
            }, 2000);
        }, 600);
        
    } else {
        console.log('Seção de estratégias não encontrada!');
    }
}

// Navegação para o gráfico
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado');
    
    setTimeout(() => {
        const analysisLinks = document.querySelectorAll('.nav-link');
        console.log('Links encontrados:', analysisLinks.length);
        
        analysisLinks.forEach((link, index) => {
            const linkText = link.textContent.trim();
            console.log(`Link ${index}:`, linkText);
            
            // Link para Análises
            if (linkText === 'Análises') {
                console.log('Link "Análises" encontrado!');
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    console.log('Clicou em Análises!');
                    scrollToChart();
                });
            }
            
            // Link para Estratégia - AGORA COM SCROLL SUAVE
            if (linkText === 'Estratégia') {
                console.log('Link "Estratégia" encontrado!');
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    console.log('Clicou em Estratégia!');
                    scrollToStrategy();
                });
            }
        });
        
        // Links ativos
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
            });
        });
        
    }, 100);
});

// Função de backup que pode ser chamada diretamente
window.scrollToChart = scrollToChart;
window.scrollToStrategy = scrollToStrategy;
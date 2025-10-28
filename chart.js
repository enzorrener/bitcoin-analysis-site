// ===== BITCOIN CHART - Dados Reais da API CoinGecko =====

class BitcoinChart {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.chart = null;
        this.currentPeriod = '7';
        this.isLoading = false;

        this.init();
    }

    init() {
        // Cria o gráfico inicial
        this.createChart();
        // Carrega os dados do período padrão (7 dias)
        this.loadData('7');
    }

    createChart() {
        const ctx = this.canvas.getContext('2d');

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Bitcoin (BTC/USD)',
                    data: [],
                    borderColor: '#f7931a',
                    backgroundColor: 'rgba(247, 147, 26, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#f7931a',
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: '#f5f5f5',
                            font: {
                                size: 14,
                                weight: '600',
                                family: 'Inter'
                            },
                            padding: 20
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(26, 26, 26, 0.95)',
                        titleColor: '#f5f5f5',
                        bodyColor: '#f5f5f5',
                        borderColor: '#f7931a',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: false,
                        titleFont: {
                            size: 14,
                            weight: '600',
                            family: 'Inter'
                        },
                        bodyFont: {
                            size: 16,
                            weight: '700',
                            family: 'Inter'
                        },
                        callbacks: {
                            label: function(context) {
                                return '$' + context.parsed.y.toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                });
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(42, 42, 42, 0.5)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#a1a1a1',
                            font: {
                                size: 12,
                                family: 'Inter'
                            },
                            maxRotation: 0,
                            autoSkipPadding: 20
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(42, 42, 42, 0.5)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#a1a1a1',
                            font: {
                                size: 12,
                                family: 'Inter'
                            },
                            callback: function(value) {
                                return '$' + value.toLocaleString('en-US');
                            }
                        }
                    }
                }
            }
        });
    }

    async loadData(days) {
        if (this.isLoading) return;

        this.isLoading = true;
        this.currentPeriod = days;

        // Mostra loading
        this.showLoading();

        try {
            // Converte dias para intervalo e limite da Binance
            const { interval, limit } = this.getDaysToInterval(days);

            const url = `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${interval}&limit=${limit}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error('Erro ao buscar dados da API');
            }

            const data = await response.json();

            // Converte formato Binance para formato de preços
            const prices = data.map(item => [
                item[0], // timestamp
                parseFloat(item[4]) // preço de fechamento
            ]);

            // Processa os dados
            this.updateChart(prices, days);

        } catch (error) {
            console.error('Erro ao carregar dados do Bitcoin:', error);
            this.showError(error.message);
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }

    getDaysToInterval(days) {
        // Converte período em dias para intervalo da Binance
        switch(days) {
            case '1':
                return { interval: '5m', limit: 288 }; // 24h com candles de 5 min
            case '7':
                return { interval: '1h', limit: 168 }; // 7 dias com candles de 1h
            case '30':
                return { interval: '4h', limit: 180 }; // 30 dias com candles de 4h
            case '90':
                return { interval: '12h', limit: 180 }; // 90 dias com candles de 12h
            case '365':
                return { interval: '1d', limit: 365 }; // 1 ano com candles diários
            case 'max':
                return { interval: '1w', limit: 500 }; // Máximo com candles semanais
            default:
                return { interval: '1h', limit: 168 };
        }
    }

    updateChart(prices, days) {
        // Formata os dados para o gráfico
        const labels = [];
        const values = [];

        // Define o formato de data baseado no período
        const dateFormat = this.getDateFormat(days);

        prices.forEach(([timestamp, price]) => {
            const date = new Date(timestamp);
            labels.push(this.formatDate(date, dateFormat));
            values.push(price);
        });

        // Reduz o número de pontos para melhor performance
        const step = this.getDataStep(prices.length);
        const filteredLabels = labels.filter((_, index) => index % step === 0);
        const filteredValues = values.filter((_, index) => index % step === 0);

        // Atualiza o gráfico
        this.chart.data.labels = filteredLabels;
        this.chart.data.datasets[0].data = filteredValues;
        this.chart.update('none'); // Atualiza sem animação para ser mais rápido

        // Atualiza o título do período
        this.updatePeriodTitle(days);
    }

    getDateFormat(days) {
        if (days === '1') return 'time';
        if (days === '7') return 'short';
        if (days === '30' || days === '90') return 'medium';
        return 'long';
    }

    formatDate(date, format) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        switch(format) {
            case 'time':
                return `${day}/${month} ${hours}:${minutes}`;
            case 'short':
                return `${day}/${month}`;
            case 'medium':
                return `${day}/${month}`;
            case 'long':
                const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                return `${monthNames[date.getMonth()]}/${year}`;
            default:
                return `${day}/${month}/${year}`;
        }
    }

    getDataStep(totalPoints) {
        // Reduz a quantidade de pontos para performance
        if (totalPoints > 500) return Math.ceil(totalPoints / 200);
        if (totalPoints > 300) return Math.ceil(totalPoints / 150);
        return 1;
    }

    updatePeriodTitle(days) {
        const titleElement = document.getElementById('chart-period-title');
        if (!titleElement) return;

        const titles = {
            '1': 'Últimas 24 Horas',
            '7': 'Últimos 7 Dias',
            '30': 'Últimos 30 Dias',
            '90': 'Últimos 90 Dias',
            '365': 'Último Ano',
            'max': 'Histórico Completo'
        };

        titleElement.textContent = titles[days] || 'Gráfico Bitcoin';
    }

    showLoading() {
        const loadingElement = document.getElementById('chart-loading');
        if (loadingElement) {
            loadingElement.style.display = 'flex';
        }
    }

    hideLoading() {
        const loadingElement = document.getElementById('chart-loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }

    showError(message) {
        console.error('Detalhes do erro:', message);
        const errorMsg = message || 'Erro ao carregar dados do Bitcoin. Verifique sua conexão.';
        alert(errorMsg);
    }
}

// Inicializa o gráfico quando a página carregar
let bitcoinChart = null;

document.addEventListener('DOMContentLoaded', function() {
    // Aguarda um pouco para garantir que o canvas existe
    setTimeout(() => {
        const canvas = document.getElementById('bitcoin-chart');
        if (canvas) {
            bitcoinChart = new BitcoinChart('bitcoin-chart');

            // Adiciona eventos aos botões de período
            document.querySelectorAll('.period-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const period = this.dataset.period;

                    // Remove active de todos os botões
                    document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));

                    // Adiciona active no botão clicado
                    this.classList.add('active');

                    // Carrega os dados do período
                    bitcoinChart.loadData(period);
                });
            });
        } else {
            console.error('Canvas do gráfico não encontrado');
        }
    }, 100);
});

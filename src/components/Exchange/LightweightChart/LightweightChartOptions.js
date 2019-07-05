import { createChart } from '../../../../node_modules/lightweight-charts/dist/lightweight-charts.esm.production';

const SDEX_PRICE_FORMAT = { type: 'price', precision: 7, minMove: 0.0000001 };

export function createLightChart(element, cursorMode) {
    return createChart(element, {
        width: element.clientWidth,
        height: element.clientHeight - 72,
        priceScale: {
            autoScale: true,
            invertScale: false,
            alignLabels: true,
            borderVisible: true,
            borderColor: '#9291e0',
            scaleMargins: {
                top: 0.1,
                bottom: 0.2,
            },
        },
        timeScale: {
            rightOffset: 10,
            fixLeftEdge: true,
            lockVisibleTimeRangeOnResize: true,
            rightBarStaysOnScroll: true,
            borderVisible: true,
            borderColor: '#9291e0',
            visible: true,
            timeVisible: true,
        },
        crosshair: {
            vertLine: {
                color: 'rgba(0, 0, 0, 0.4)',
                width: 1,
                style: 3,
                visible: true,
                labelVisible: true,
            },
            horzLine: {
                color: 'rgba(0, 0, 0, 0.4)',
                width: 1,
                style: 3,
                visible: true,
                labelVisible: true,
            },
            mode: cursorMode,
        },
        grid: {
            vertLines: {
                color: 'rgba(70, 130, 180, 0.5)',
                style: 1,
                visible: true,
            },
            horzLines: {
                color: 'rgba(70, 130, 180, 0.5)',
                style: 1,
                visible: true,
            },
        },
        localization: {
            locale: 'en-US',
        },
    });
}

export function getLineOptions() {
    return {
        topColor: '#c0ecff',
        bottomColor: 'rgb(0, 120, 255, 0.0)',
        lineColor: '#6AD0FE',
        lineWidth: 3,
        priceFormat: SDEX_PRICE_FORMAT,
    };
}

export function getCandlestickOptions() {
    return {
        upColor: '#4caf50',
        downColor: '#ef5350',
        wickVisible: true,
        borderVisible: true,
        priceFormat: SDEX_PRICE_FORMAT,
    };
}

export function getBarOptions() {
    return {
        priceFormat: SDEX_PRICE_FORMAT,
        thinBars: false,
        openVisible: true,
    };
}

export function getVolumeOptions() {
    return {
        color: 'rgba(76, 175, 80, 0.5)',
        priceLineVisible: false,
        lastValueVisible: false,
        overlay: true,
        priceFormat: {
            type: 'volume',
        },
        scaleMargins: {
            top: 0.8,
            bottom: 0,
        },
    };
}

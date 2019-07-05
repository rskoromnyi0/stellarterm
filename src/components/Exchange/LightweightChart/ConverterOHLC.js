// Minimal timeFrame - 15 min
export const FRAME_FOURTH_HOUR = 900;
export const FRAME_HOUR = 3600;
export const FRAME_4HOURS = 14400;
export const FRAME_DAY = 86400;
export const FRAME_WEEK = 604800;
export const ZEROS_NUMBER = 7;

export function fillWithZeros(value) {
    // Fill value with zeros on the end, 1.4 => 1.4000000
    const fractionNumber = String(value).split('.')[1] || '0';

    return fractionNumber.length <= ZEROS_NUMBER ? value.toFixed(ZEROS_NUMBER) : value;
}

export function getVolumeData(trades, { baseBuying, counterSelling }) {
    return trades.map((trade) => {
        // Displays XLM volume, if traded to xlm, else used base_volume
        const isBaseNativeXLM = baseBuying.code === 'XLM' && baseBuying.issuer === undefined;
        const isCounterNativeXLM = counterSelling.code === 'XLM' && counterSelling.issuer === undefined;
        const isTradeToXLM = isBaseNativeXLM || isCounterNativeXLM;

        const volumeXLM = isBaseNativeXLM ? trade.baseVolume : trade.counterVolume;
        const volume = isTradeToXLM ? volumeXLM : trade.baseVolume;

        return {
            time: trade.time,
            value: parseFloat(volume.toFixed(7)),
            color: trade.open <= trade.close ? 'rgba(76, 175, 80, 0.5)' : 'rgba(239, 83, 80, 0.5)',
        };
    });
}

export function sliceDataToChunks(trades, timeFrame) {
    // Chunk size based on minimal 15-min timeframe
    const chunkSize = timeFrame / FRAME_FOURTH_HOUR;

    const toChunks = (arr, size) =>
        Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, (i * size) + size));

    // Remove timeframes, which cannot be sliced to chunk
    trades.splice(0, trades.length % chunkSize);

    return toChunks(trades, chunkSize).map(chunk =>
        chunk.reduce((prev, current) => {
            const timeLow = Math.min(current.time, prev.time);
            const timeHigh = Math.max(current.time, prev.time);
            const low = Math.min(current.low, prev.low);
            const high = Math.max(current.high, prev.high);
            const open = chunk.find(el => el.time === timeLow).open;
            const close = chunk.find(el => el.time === timeHigh).close;
            const baseVolume = prev.baseVolume + current.baseVolume;
            const counterVolume = prev.counterVolume + current.counterVolume;

            return {
                time: timeLow,
                open,
                high,
                low,
                close,
                baseVolume,
                counterVolume,
            };
        }),
    );
}

export function convertTimeframeData(trades, timeFrame) {
    const nullTrades = [];
    trades.forEach((trade, index) => {
        const tradesInterval = index !== 0 ? trade.time - trades[index - 1].time : FRAME_FOURTH_HOUR;
        const nullIntervalsCount = (tradesInterval / FRAME_FOURTH_HOUR) - 1;
        for (let i = 1; i <= nullIntervalsCount; i++) {
            const nullTrade = {
                time: trades[index - 1].time + (FRAME_FOURTH_HOUR * i),
                open: trades[index - 1].close,
                high: trades[index - 1].open,
                low: trades[index - 1].open,
                close: trades[index - 1].close,
                baseVolume: 0,
                counterVolume: 0,
            };
            nullTrades.push(nullTrade);
        }
    });

    const filledTrades = [...trades, ...nullTrades].sort((a, b) => a.time - b.time);
    return sliceDataToChunks(filledTrades, timeFrame);
}

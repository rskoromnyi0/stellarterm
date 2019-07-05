import React from 'react';
import PropTypes from 'prop-types';
import Driver from '../../../lib/Driver';
import * as chartOptions from './LightweightChartOptions';
import * as converterOHLC from './ConverterOHLC';
import Ellipsis from '../../Common/Ellipsis/Ellipsis';
import { CrosshairMode } from '../../../../node_modules/lightweight-charts/dist/lightweight-charts.esm.production';

export default class LightweightChart extends React.Component {
    static setPointData(trade, volume) {
        const pointDiv = document.getElementById('pointData');
        const spanClass = `data_Item ${trade.open > trade.close ? 'changeNegative' : 'changePositive'}`;

        pointDiv.innerHTML = `
        <span class="${spanClass}">O: ${converterOHLC.fillWithZeros(trade.open)}</span>
        <span class="${spanClass}">H: ${converterOHLC.fillWithZeros(trade.high)}</span>
        <span class="${spanClass}">L: ${converterOHLC.fillWithZeros(trade.low)}</span>
        <span class="${spanClass}">C: ${converterOHLC.fillWithZeros(trade.close)}</span>
        <span class="${spanClass}">Volume: ${converterOHLC.fillWithZeros(volume.value)}</span>`;
    }

    constructor(props) {
        super(props);
        this.TRADES_DATA = [];
        this.TRADES_VOLUME = [];

        this.state = {
            chartInited: false,
        };
    }

    componentDidMount() {
        const { data, event } = this.props.d.orderbook;
        if (data.trades !== undefined) {
            this.chartInit(data);
        } else {
            this.unsub = event.sub(() => {
                if (!this.state.chartInited && data.trades !== undefined) {
                    this.chartInit(data);
                }
            });
        }
    }

    shouldComponentUpdate() {
        return this.CHART !== undefined;
    }

    componentDidUpdate() {
        const elem = document.getElementById('LightChart');
        this.CHART.applyOptions({
            width: elem.clientWidth,
            height: elem.clientHeight,
        });
        this.setChartData(this.data.trades);
    }

    componentWillUnmount() {
        if (this.unsub) {
            this.unsub();
        }
    }

    setChartData(trades) {
        const { timeFrame } = this.props;
        const { data } = this.props.d.orderbook;

        this.TRADES_DATA = converterOHLC.convertTimeframeData(trades, timeFrame);
        this.TRADES_VOLUME = converterOHLC.getVolumeData(this.TRADES_DATA, data);

        this.ohlcSeries.setData(this.TRADES_DATA);
        this.volumeSeries.setData(this.TRADES_VOLUME);

        // Set ohlc view volumes from last trade
        if (this.TRADES_DATA.length !== 0) {
            this.constructor.setPointData(this.TRADES_DATA.reverse()[0], this.TRADES_VOLUME.reverse()[0]);
        }
    }

    getTimeFrameBtn(btnText, timeFrame) {
        return (
            <a
                className={`timeBtn ${this.props.timeFrame === timeFrame ? 'timeBtn_active' : ''}`}
                onClick={() => this.props.onUpdate(timeFrame)}>
                {btnText}
            </a>
        );
    }

    getTimeScrollBtn() {
        const timeScale = this.CHART.timeScale();

        return (
            <a className="scrollTime_btn" onClick={() => timeScale.scrollToRealTime()}>
                {'>'}
            </a>
        );
    }

    setChartSettings() {
        const { lineChart, barChart, candlestickChart } = this.props;

        const chartCursorMode = lineChart ? CrosshairMode.Magnet : CrosshairMode.Normal;

        window.lightChart.innerHTML = '';
        this.CHART = chartOptions.createLightChart(window.lightChart, chartCursorMode);

        if (barChart) {
            this.ohlcSeries = this.CHART.addBarSeries(chartOptions.getBarOptions());
        } else if (candlestickChart) {
            this.ohlcSeries = this.CHART.addCandlestickSeries(chartOptions.getCandlestickOptions());
        } else if (lineChart) {
            this.ohlcSeries = this.CHART.addAreaSeries(chartOptions.getLineOptions());
        }
        this.volumeSeries = this.CHART.addHistogramSeries(chartOptions.getVolumeOptions());

        this.CHART.subscribeCrosshairMove((param) => {
            if (!param.point || param.time === undefined) {
                return;
            }

            const pointVolume = this.TRADES_VOLUME.find(volume => volume.time === param.time);
            const pointTrade = this.TRADES_DATA.find(trade => trade.time === param.time);
            this.constructor.setPointData(pointTrade, pointVolume);
        });

        this.setState({ chartInited: true });
    }

    chartInit(data) {
        this.data = data;
        window.lightChart = document.getElementById('LightChart');

        if (data.trades.length === 0) {
            window.lightChart.querySelector('p').textContent = 'No trade history founded!';
            return;
        }

        if (this.state.chartInited) {
            this.setChartData(data.trades);
        } else {
            this.setChartSettings();
        }
    }

    render() {
        const { chartInited } = this.state;
        const { data } = this.props.d.orderbook;
        const pairName = `${data.baseBuying.code}/${data.counterSelling.code}`;

        return (
            <React.Fragment>
                {chartInited ? (
                    <React.Fragment>
                        <div className="control_Panel">
                            <div className="timeFrame_btns">
                                {this.getTimeFrameBtn('15m', converterOHLC.FRAME_FOURTH_HOUR)}
                                {this.getTimeFrameBtn('1h', converterOHLC.FRAME_HOUR)}
                                {this.getTimeFrameBtn('4h', converterOHLC.FRAME_4HOURS)}
                                {this.getTimeFrameBtn('1d', converterOHLC.FRAME_DAY)}
                                {this.getTimeFrameBtn('1w', converterOHLC.FRAME_WEEK)}
                            </div>
                            <div className="chart_Data">
                                <div className="pair_Name">{pairName}</div>
                                <div id="pointData" />
                            </div>
                        </div>
                        {this.getTimeScrollBtn()}
                    </React.Fragment>
                ) : null}

                <div id="LightChart">
                    <p className="chart_message">
                        Loading historical price data
                        <Ellipsis />
                    </p>
                </div>
            </React.Fragment>
        );
    }
}

LightweightChart.propTypes = {
    d: PropTypes.instanceOf(Driver).isRequired,
    onUpdate: PropTypes.func.isRequired,
    timeFrame: PropTypes.number.isRequired,
    candlestickChart: PropTypes.bool,
    barChart: PropTypes.bool,
    lineChart: PropTypes.bool,
};

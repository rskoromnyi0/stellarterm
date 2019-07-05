import React from 'react';
import PropTypes from 'prop-types';
import Driver from '../../lib/Driver';
import Stellarify from '../../lib/Stellarify';
import directory from '../../../directory/directory';
import ManageOffers from './ManageOffers/ManageOffers';
import OfferTables from './OfferTables/OfferTables';
import OfferMakers from './OfferMakers/OfferMakers';
import PairPicker from './PairPicker/PairPicker';
import LightweightChart from './LightweightChart/LightweightChart';
import Ellipsis from '../Common/Ellipsis/Ellipsis';
import Generic from '../Common/Generic/Generic';
import images from '../../images';
import FullscreenKeyAlert from './FullscreenKeyAlert/FullscreenKeyAlert';
import * as converterOHLC from './LightweightChart/ConverterOHLC';

const BAR = 'barChart';
const CANDLE = 'candlestickChart';
const LINE = 'lineChart';

export default class Exchange extends React.Component {
    constructor(props) {
        super(props);
        this.unsub = this.props.d.orderbook.event.sub(() => {
            this.forceUpdate();
        });
        this.unsubSession = this.props.d.session.event.sub(() => {
            this.forceUpdate();
        });

        this.state = {
            chartType: 'lineChart',
            fullscreenMode: false,
            timeFrame: converterOHLC.FRAME_HOUR,
        };
        this._handleKeyDown = this._handleKeyDown.bind(this);
    }

    componentWillMount() {
        window.scrollTo(0, 0);
    }

    componentDidMount() {
        document.addEventListener('keyup', this._handleKeyDown);
    }

    componentWillUnmount() {
        this.unsub();
        this.unsubSession();
        document.removeEventListener('keyup', this._handleKeyDown);

        if (this.state.fullscreenMode) {
            this.toggleFullScreen();
        }
    }

    getChartSwitcherPanel() {
        const { chartType, fullscreenMode } = this.state;

        return (
            <div className="island__header chart_Switcher">
                <div className="switch_Tabs">
                    <a
                        onClick={() => this.setState({ chartType: 'lineChart' })}
                        className={chartType === LINE ? 'activeChart' : ''}>
                        Linechart
                    </a>
                    <a
                        onClick={() => this.setState({ chartType: 'candlestickChart' })}
                        className={chartType === CANDLE ? 'activeChart' : ''}>
                        Candlestick
                    </a>
                    <a
                        onClick={() => this.setState({ chartType: 'barChart' })}
                        className={chartType === BAR ? 'activeChart' : ''}>
                        Bar chart
                    </a>
                </div>
                <div className="fullscreen_Block">
                    {fullscreenMode ? (
                        <img src={images['icon-fullscreen-minimize']} alt="F" onClick={() => this.toggleFullScreen()} />
                    ) : (
                        <img src={images['icon-fullscreen']} alt="F" onClick={() => this.toggleFullScreen()} />
                    )}
                </div>
            </div>
        );
    }

    toggleFullScreen() {
        const { fullscreenMode } = this.state;
        document.body.style.overflow = fullscreenMode ? 'auto' : 'hidden';
        document.getElementById('stellarterm_header').classList.toggle('header_Sticky');

        this.setState({
            fullscreenMode: !fullscreenMode,
        });
    }

    _handleKeyDown(e) {
        const { fullscreenMode } = this.state;

        if (this.props.d.orderbook.data.ready) {
            switch (e.code) {
            case 'Escape':
                if (fullscreenMode) {
                    this.toggleFullScreen();
                }
                break;
            case 'KeyF':
                this.toggleFullScreen();
                break;
            default:
                break;
            }
        }
    }

    checkOrderbookWarning() {
        const ticker = this.props.d.ticker;
        const data = this.props.d.orderbook.data;

        if (ticker.ready) {
            const baseSlug = Stellarify.assetToSlug(data.baseBuying);
            const counterSlug = Stellarify.assetToSlug(data.counterSelling);
            let aggregateDepth = 0;

            if (baseSlug !== 'XLM-native') {
                ticker.data.assets.forEach((asset) => {
                    if (asset.slug === baseSlug) {
                        aggregateDepth += asset.depth10_USD;
                    }
                });
            }

            if (counterSlug !== 'XLM-native') {
                ticker.data.assets.forEach((asset) => {
                    if (asset.slug === counterSlug) {
                        aggregateDepth += asset.depth10_USD;
                    }
                });
            }

            if (aggregateDepth < 100) {
                return (
                    <div className="Exchange__warning">
                        <div className="s-alert s-alert--warning">
                            The orderbook for this pair is thin. To get a better price, create an offer without taking
                            an existing one.
                        </div>
                    </div>
                );
            }
        }
        return null;
    }

    render() {
        if (!this.props.d.orderbook.data.ready) {
            return (
                <Generic title="Loading orderbook">
                    Loading orderbook data from Horizon
                    <Ellipsis />
                </Generic>
            );
        }

        const thinOrderbookWarning = this.checkOrderbookWarning();
        const data = this.props.d.orderbook.data;
        let warningWarning;

        const directoryAsset = directory.getAssetByAccountId(data.baseBuying.code, data.baseBuying.issuer);
        if (directoryAsset !== null && directoryAsset.warning !== undefined) {
            warningWarning = (
                <div className="Exchange__warning">
                    <div className="s-alert s-alert--warning">{directoryAsset.warning}</div>
                </div>
            );
        }

        let offermakers;
        if (directoryAsset !== null && directoryAsset.disabled !== undefined) {
            offermakers = (
                <div className="Exchange__orderbookDisabled">
                    Offer making has been disabled for this pair. You may still cancel your existing offers below.
                </div>
            );
        } else {
            offermakers = <OfferMakers d={this.props.d} />;
        }

        const { chartType, fullscreenMode } = this.state;
        const chartSwitcherPanel = this.getChartSwitcherPanel();

        return (
            <div>
                <div className="so-back islandBack islandBack--t">
                    <PairPicker d={this.props.d} />
                </div>
                <div className="so-back islandBack">
                    <div className={`island ChartChunk ${fullscreenMode ? 'fullScreenChart' : ''}`}>
                        {chartSwitcherPanel}
                        {fullscreenMode ? <FullscreenKeyAlert fullscreenMode={fullscreenMode} /> : null}
                        {chartType === LINE ? (
                            <LightweightChart
                                d={this.props.d}
                                lineChart
                                timeFrame={this.state.timeFrame}
                                onUpdate={timeFrame => this.setState({ timeFrame })} />
                        ) : null}
                        {chartType === CANDLE ? (
                            <LightweightChart
                                d={this.props.d}
                                candlestickChart
                                timeFrame={this.state.timeFrame}
                                onUpdate={timeFrame => this.setState({ timeFrame })} />
                        ) : null}
                        {chartType === BAR ? (
                            <LightweightChart
                                d={this.props.d}
                                barChart
                                timeFrame={this.state.timeFrame}
                                onUpdate={timeFrame => this.setState({ timeFrame })} />
                        ) : null}
                    </div>
                </div>
                <div className="so-back islandBack">
                    <div className="island Exchange__orderbook">
                        <div className="island__header">Orderbook</div>
                        {thinOrderbookWarning}
                        {warningWarning}
                        <div>
                            {offermakers}
                            <div className="island__separator" />
                            <OfferTables d={this.props.d} />
                        </div>
                    </div>
                </div>
                <div className="so-back islandBack">
                    <div className="island">
                        <div className="island__header">Manage offers</div>
                        <ManageOffers d={this.props.d} />
                    </div>
                </div>
            </div>
        );
    }
}

Exchange.propTypes = {
    d: PropTypes.instanceOf(Driver).isRequired,
};

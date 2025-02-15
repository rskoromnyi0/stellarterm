import React from 'react';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';
import Driver from '../../../../../lib/Driver';
import TrustButton from '../../../../Common/AssetRow/TrustButton/TrustButton';
import OfferMakerResultMessage from './OfferMakerResultMessage/OfferMakerResultMessage';

export default class OfferMakerOverview extends React.Component {
    static capDigits(input) {
        try {
            return new BigNumber(input).toFixed(7).toString();
        } catch (e) {
            return (Math.floor((input * 10000000)) / 10000000).toFixed(7);
        }
    }

    getBalance() {
        const { targetAsset } = this.props;
        const maxOffer = this.calculateMaxOffer();
        const maxOfferView = this.constructor.capDigits(maxOffer);
        const inputSideType = this.props.side === 'buy' ? 'total' : 'amount';

        const tradeMaxLink = (
            <a className="link_toInput" onClick={() => this.props.updateInputData(inputSideType, maxOfferView)}>
                {maxOfferView}
            </a>
        );

        return (
            <div>
                <div className="offer_userBalance">
                    {targetAsset.isNative() ? (
                        <div>
                            You may trade up to {tradeMaxLink} XLM (due to{' '}
                            <a href="#account">minimum balance requirements</a>.)
                        </div>
                    ) : (
                        <div>
                            You have {tradeMaxLink} {targetAsset.getCode()}
                        </div>
                    )}
                </div>
                {this.isInsufficientBalance() && (
                    <p className="offer_wrongBalance">
                        Error: You do not have enough {targetAsset.getCode()} to create this offer.
                    </p>
                )}
            </div>
        );
    }
    getInputSummaryMessage(capitalizedSide, baseBuying, counterSelling, minValue) {
        const { valid, amount, total } = this.props.offerState;
        if (!valid) {
            return null;
        }

        const invalidPrecision = amount < minValue || total < minValue;
        const errorPrecisionMessage = invalidPrecision ? (
            <p className="offer_wrongBalance">
                Error: Minimal amount of any asset for trading is {this.constructor.capDigits(minValue)}
            </p>
        ) : null;

        return (
            <div>
                {errorPrecisionMessage}
                <div className="s-alert s-alert--info">
                    {capitalizedSide} {this.constructor.capDigits(amount)} {baseBuying.getCode()} for{' '}
                    {this.constructor.capDigits(total)} {counterSelling.getCode()}
                </div>
            </div>
        );
    }

    getSubmitButton(capitalizedSide, baseBuying, minValue) {
        const { valid, buttonState, amount, total } = this.props.offerState;
        const isButtonReady = buttonState === 'ready';
        const invalidPrecision = amount < minValue || total < minValue;

        return (
            <input
                type="submit"
                className="s-button"
                value={isButtonReady ? `${capitalizedSide} ${baseBuying.getCode()}` : 'Creating offer...'}
                disabled={!valid || this.isInsufficientBalance() || !isButtonReady || invalidPrecision} />
        );
    }

    getTrustNeededAssets(baseBuying, counterSelling) {
        const { account } = this.props.d.session;
        const baseBalance = account.getBalance(baseBuying);
        const counterBalance = account.getBalance(counterSelling);

        const trustNeededAssets = [];
        if (baseBalance === null) {
            trustNeededAssets.push(baseBuying);
        }
        if (counterBalance === null) {
            trustNeededAssets.push(counterSelling);
        }
        return trustNeededAssets;
    }

    calculateMaxOffer() {
        const { targetAsset } = this.props;
        const { account } = this.props.d.session;
        const maxLumenSpend = account.maxLumenSpend();

        const targetBalance = targetAsset.isNative() ? maxLumenSpend : account.getBalance(targetAsset);
        const reservedBalance = account.getReservedBalance(targetAsset);

        return parseFloat(targetBalance) > parseFloat(reservedBalance) ? targetBalance - reservedBalance : 0;
    }

    isInsufficientBalance() {
        const isBuy = this.props.side === 'buy';
        const maxOffer = this.calculateMaxOffer();
        const { amount, total } = this.props.offerState;

        if (amount === 'Infinity') {
            return true;
        }
        return Number(isBuy ? total : amount) > Number(maxOffer);
    }

    render() {
        const login = this.props.d.session.state === 'in';
        const { baseBuying, counterSelling } = this.props.d.orderbook.data;
        const isBuy = this.props.side === 'buy';
        const capitalizedSide = isBuy ? 'Buy' : 'Sell';

        if (!login) {
            return (
                <div>
                    {this.getInputSummaryMessage(capitalizedSide, baseBuying, counterSelling)}
                    <span className="offer_message">
                        <a href="#account">Log in</a> to create an offer
                    </span>
                </div>
            );
        }

        const trustNeededAssets = this.getTrustNeededAssets(baseBuying, counterSelling);

        if (trustNeededAssets.length) {
            return (
                <div>
                    <p className="offer_acceptAsset">To trade, activate these assets on your account:</p>
                    <div className="row__multipleButtons">
                        {trustNeededAssets.map(asset => (
                            <TrustButton
                                key={`${asset.getCode()}-${asset.getIssuer()}`}
                                d={this.props.d}
                                asset={asset}
                                message={`${asset.getCode()} accepted`}
                                trustMessage={`Accept ${asset.getCode()}`} />
                        ))}
                    </div>
                </div>
            );
        }

        // The smallest asset amount unit is one ten-millionth: 1/10000000 or 0.0000001.
        // https://www.stellar.org/developers/guides/concepts/assets.html#amount-precision-and-representation

        const minValue = 0.0000001;

        return (
            <div className="offer_overview">
                {this.getBalance()}
                {this.getInputSummaryMessage(capitalizedSide, baseBuying, counterSelling, minValue)}
                <OfferMakerResultMessage offerState={this.props.offerState} />
                {this.getSubmitButton(capitalizedSide, baseBuying, minValue)}
            </div>
        );
    }
}
OfferMakerOverview.propTypes = {
    side: PropTypes.oneOf(['buy', 'sell']).isRequired,
    d: PropTypes.instanceOf(Driver).isRequired,
    targetAsset: PropTypes.objectOf(PropTypes.string),
    offerState: PropTypes.shape({
        valid: PropTypes.bool,
        amount: PropTypes.string,
        total: PropTypes.string,
        buttonState: PropTypes.oneOf(['ready', 'pending']),
    }).isRequired,
    updateInputData: PropTypes.func,
};

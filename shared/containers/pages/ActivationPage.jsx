'use strict';

import React, {Component, PropTypes} from 'react';
import { connect }                   from 'react-redux';
import strformat                     from 'strformat';

import { loadActivation }  from '../../actions/activations';
import connectDataFetchers from '../../lib/connectDataFetchers.jsx';
import EmbedEvents         from '../../utils/EmbedEventsUtil';
import config              from '../../config';
import { sendEvent }       from '../../utils/googleAnalytics';

import ActivationPage from '../../components/pages/ActivationPage.jsx';

const embedEvents = new EmbedEvents({
    embedOrigin: config.embedOrigin
});

class ActivationPageContainer extends Component {
    static contextTypes = { i18n: PropTypes.object };

    state = {
        sharingLink     : '',
        isLoggingIn     : false
    };

    componentWillMount() {
        const { id, userId } = this.props.params;

        if (userId) {
            this.props.history.replaceState(null, `/activations/${id}`);
        }
    }

    handlePassActivationClick = (activation) => {
        const isEmbedded = this.props.location.query.embed;
        const { actionId, isSponsored } = activation;

        if (isEmbedded) {
            embedEvents.send({
                type : 'PASS_TEST',
                actionId
            });
        } else {
            this.setState({ isLoggingIn: true });
        }

        if (isSponsored) {
            sendEvent('sponsored activation', 'pass click');
        } else {
            sendEvent('activation', 'pass');
        }
    };

    handleViewAnswers = (activation) => {
        const isEmbedded = this.props.location.query.embed;

        if (isEmbedded && activation.isPassed) {
            const quizSessionId = activation.userQuizSession.id;

            embedEvents.send({
                type : 'VIEW_ANSWERS',
                quizSessionId
            });
        }
    };

    handleSponsoredClick = (activation) => {
        const isEmbedded = this.props.location.query.embed;
        const { id } = activation;

        if (isEmbedded) {
            embedEvents.send({
                type         : 'COURSE_REQUEST',
                activationId : id
            });
        } else {
            this.setState({ isLoggingIn: true });
            this.props.history.pushState(null, this.props.location.pathname, {
                requestActivationId: id
            });
        }

        sendEvent('sponsored activation', 'request click');
    };

    handleGoBack = () => {
        this.props.history.pushState(null, `/activations`, {
            embed      : this.props.location.query.embed,
            assigneeId : this.props.location.query.assigneeId
        });
    };

    handleActivationClick = (activation) => {
        this.props.history.pushState(null, `/activations/${activation.id}`, {
            embed      : this.props.location.query.embed,
            assigneeId : this.props.location.query.assigneeId
        });

        sendEvent('activation', 'author activations', 'click');
    };

    handleShare = (activation) => {
        this.setState({
            sharingLink : activation.publicLink
        });

        sendEvent('activation', 'share', 'click');
    };

    handleShareResult = (activation) => {
        this.setState({
            sharingLink : activation.userQuizSession.shareResultLink
        });

        sendEvent('activation', 'share result', 'click');
    };

    handleStopSharing = () => {
        this.setState({
            sharingLink : ''
        });
    };

    handleLoginClose = () => {
        this.setState({
            isLoggingIn : false
        });
    };

    componentWillReceiveProps(nextProps) {
        if (this.props.params.id !== nextProps.params.id) {
            this.props.dispatch(loadActivation(nextProps.params, nextProps.location.query) );
        }
    }

    render() {
        const { activation, authorActivations, isLoading } = this.props;
        const { sharingLink, isLoggingIn } = this.state;
        const { embed, assigneeId } = this.props.location.query;

        return (
            <ActivationPage
                activation         = {activation}
                authorActivations  = {authorActivations}
                sharingLink        = {sharingLink}
                isLoading          = {isLoading}
                isEmbedded         = {embed}
                isLoggingIn        = {isLoggingIn}
                showUserResult     = {activation.isPassed && assigneeId}

                onPass             = {this.handlePassActivationClick}
                onSponsoredClick   = {this.handleSponsoredClick}
                onViewAnswers      = {this.handleViewAnswers}
                onActivationClick  = {this.handleActivationClick}
                onGoBack           = {this.handleGoBack}
                onShare            = {this.handleShare}
                onShareResult      = {this.handleShareResult}
                onStopSharing      = {this.handleStopSharing}
                onLoginDialogClose = {this.handleLoginClose}
            />
        );
    }
}

function mapStateToProps({ currentActivation: {activation, authorActivations, isLoading} }) {
    return {
        activation,
        authorActivations,
        isLoading
    };
}

export default connect( mapStateToProps )(
    connectDataFetchers(ActivationPageContainer, [ loadActivation ])
);

import React, { Component } from "react"
import { connect } from "react-redux"
import { exchangeSelector } from "../store/selectors";
import { loadAllOrders, subscribeToEvents } from "../store/interations"
import  OrderBook from "./OrderBook"
import PriceChart from "./PriceChart"
import ExTransactions from "./ExTransactions"
import Trades from "./Trades"
import Balance from "./Balance"

class Content extends Component {
  componentWillUnmount() {
    this.loadBlockchainData(this.props);
  }

  async loadBlockchainData(props) {
    const { exchange, dispatch } = props
    await loadAllOrders( exchange, dispatch)
    await subscribeToEvents(exchange, dispatch)
  }

  render() {
    return (
      <div className="content">
        <div className="vertical-split">
          <Balance />
          <div className="card bg-dark text-white">
            <div className="card-header">Card Title</div>
            <div className="card-body">
              <p className="card-text">
                Some quick example text to build on the card title and make up
                the bulk of the card's content.
              </p>
              <a href="/#" className="card-link">
                Card link
              </a>
            </div>
          </div>
        </div>
          <OrderBook type="table" />
        <div className="vertical-split">
          <PriceChart />
          <ExTransactions type="table" />
        </div>
          <Trades />
      </div>
    )
  }
}

function mapStateToProps(state) {
    return {
       exchange: exchangeSelector(state)
    }
}

export default connect(mapStateToProps)(Content)

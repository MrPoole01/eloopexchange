import React, { Component } from "react"
import { connect } from "react-redux"
import { exchangeSelector } from "../store/selectors";
import { loadAllOrders, subscribeToEvents } from "../store/interactions"
import  OrderBook from "./OrderBook"
import PriceChart from "./PriceChart"
import Transactions from "./ExTransactions"
import Trades from "./Trades"
import Balance from "./Balance"
import NewOrder from "./NewOrder"

class Content extends Component {
  componentWillMount() {
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
         <NewOrder />
        </div>
          <OrderBook type="table" />
        <div className="vertical-split">
          <PriceChart />
          <Transactions type="table" />
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

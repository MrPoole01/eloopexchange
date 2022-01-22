import React, { Component } from "react"
import { connect } from "react-redux"
import  Chart from "react-apexcharts"
import { chartOptions } from "./PriceChart.config"
import Spinner from "./spinner"
import { 
    priceChartLoadedSelector, 
    priceChartSelector 
} from "../store/selectors"

const priceSymbl = (lastPriceChange) => {
    let output
    if(lastPriceChange === '+') {
        output = <span className="text-success">&#9650;</span>
    } else {
        output = <span className="text-danger">&#9660;</span>
    }
    return (output)
}

const showPriceChart = (priceChart) => {
    return (
      <div className="price-chart">
        <div className="price">
          <h5>
            DAPP/ETH &nbsp; {priceSymbl(priceChart.lastPriceChange)} &nbsp; {priceChart.lastPrice}
          </h5>
        </div>
        <Chart
          options={chartOptions}
          series={priceChart.series}
          type="candlestick"
          width="100%"
          height="100%"
        />
      </div>
    );
}

class PriceChart extends Component {
  render() {
    return (
      <div className="card bg-dark text-white">
        <div className="card-header">Price Chart</div>
        <div className="card-body">
          { this.props.priceChartLoaded ? showPriceChart(this.props.priceChart) : <Spinner type="table" />}
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
console.log({
  priceChartLoaded: priceChartLoadedSelector(state),
  priceChart: priceChartSelector(state),
})

  return {
    priceChartLoaded: priceChartLoadedSelector(state),
    priceChart: priceChartSelector(state)
  }
}

export default connect(mapStateToProps)(PriceChart)

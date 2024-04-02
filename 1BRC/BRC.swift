
class StationAggregate {
    var name: String
    var valueCount: UInt32 = 0
    var temperatureTotal: Double = 0.0
    var temperatureMin: Double = Double.infinity
    var temperatureMax: Double = -Double.infinity

    init(name: String) {
        self.name = name
    }

    func recordTemperature(_ value: Double) {
        temperatureTotal += value
        if value < temperatureMin {
            temperatureMin = value
        }
        if value > temperatureMax {
            temperatureMax = value
        }
        valueCount += 1
    }

    var averageTemperature: Double {
        guard valueCount > 0 else { return 0.0 }
        return temperatureTotal / Double(valueCount)
    }
}

// Equivalent to Stations in Zig
class Stations {
    var stations: [String: StationAggregate] = [:]
    var resultCount: UInt64 = 0

    func store(name: String, temp: Double) {
        let station = stations[name, default: StationAggregate(name: name)]
        station.recordTemperature(temp)
        stations[name] = station
        resultCount += 1
    }

    func printSummary() {
        print("Rowscan count: \(resultCount), Storage count: \(stations.count)")
    }

    // Other methods (e.g., printSpecific, printAll) would follow the same pattern
}

// Example usage
let stations = Stations()
stations.store(name: "foo", temp: 32)
stations.store(name: "foo", temp: 10)
stations.store(name: "bar", temp: 15)
stations.printSummary()

import Foundation

// Custom error types for line parsing
enum ParseError: Error {
    case delimiterNotFound
    case lineIsComment
}

// Represents a single weather station and its aggregated temperature data
struct StationAggregate {
    var name: String
    var valueCount: UInt32 = 0
    var temperatureTotal: Double = 0.0
    var temperatureMin: Double = Double.greatestFiniteMagnitude
    var temperatureMax: Double = -Double.greatestFiniteMagnitude

    mutating func recordTemperature(_ value: Double) {
        temperatureTotal += value
        if temperatureMin == 0 || value < temperatureMin {
            temperatureMin = value
        }
        if temperatureMax == 0 || value > temperatureMax {
            temperatureMax = value
        }
        valueCount += 1
    }

    func averageTemperature() -> Double {
        guard valueCount != 0 else {
            return 0.0
        }
        return temperatureTotal / Double(valueCount)
    }
}

// Manages a collection of weather stations
class Stations {
    private var stations: [String: StationAggregate] = [:]
    var resultCount: UInt64 = 0

    func store(name: String, temp: Double) {
        if let _ = stations[name] {
            stations[name]!.recordTemperature(temp)
        } else {
            stations[name] = StationAggregate(name: name)
            stations[name]!.recordTemperature(temp)
        }
        resultCount += 1
    }

    func printSummary() {
        print("Row scan count \(resultCount) Storage count \(stations.count)")
    }

    func printSpecific(name: String) {
        if let station = stations[name] {
            print("\(station.name)=\(station.temperatureMin)/\(station.averageTemperature())/\(station.temperatureMax)")
        }
    }

    // Assuming a function that converts FilePath to String for FileManager operations
    static func getStats(fromFileStream path: FilePath) throws -> Stations {
        let stations = Stations()
        // Convert FilePath to String for FileManager
        let pathString = path.description

        // Open the file for reading; adjust based on your streaming API
        guard let file = FileHandle(forReadingAtPath: pathString) else {
            throw NSError(domain: "FileError", code: 1001, userInfo: [NSLocalizedDescriptionKey: "Unable to open file at \(pathString)"])
        }
        defer {
            file.closeFile()
        }

        var buffer = Data()
        let newline = "\n".data(using: .utf8)!

        while let chunk = try? file.read(upToCount: 1024), let data = chunk, !data.isEmpty {
            buffer.append(data)
            while let range = buffer.range(of: newline) {
                let lineData = buffer.subdata(in: buffer.startIndex..<range.lowerBound)
                buffer.removeSubrange(buffer.startIndex...range.lowerBound)

                if let line = String(data: lineData, encoding: .utf8) {
                    do {
                        let parsed = try parseLine(line)
                        stations.store(name: parsed.name, temp: parsed.value)
                    } catch ParseError.lineIsComment {
                        // Ignore comment lines
                        continue
                    } catch {
                        // For simplicity, log the error. You might want to handle it differently.
                        print("Error parsing line: \(error)")
                    }
                }
            }
        }

        return stations
    }
}

// Parses a single line of data into station name and temperature
func parseLine(_ buff: String) throws -> (name: String, value: Double) {
    if buff.first == "#" {
        throw ParseError.lineIsComment
    }
    guard let splitIndex = buff.firstIndex(of: ";") else {
        throw ParseError.delimiterNotFound
    }
    let stationName = String(buff[..<splitIndex])
    let tempStr = String(buff[buff.index(after: splitIndex)...])
    guard let temp = Double(tempStr) else {
        throw ParseError.delimiterNotFound
    }
    return (name: stationName, value: temp)
}

// Example usage
do {
    let path = FilePath("../data/measurements_10k.txt") // Convert this FilePath to String if needed
    let stats = try Stations.getStats(fromFileStream: path)
    stats.printSummary()
    // Additional processing...
} catch {
    print("An error occurred: \(error.localizedDescription)")
}

package com.evildetector

import android.content.Context
import android.net.wifi.ScanResult
import android.net.wifi.WifiManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap

class WifiScannerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "WifiScannerModule"
    }

    @ReactMethod
    fun scanWifi(promise: Promise) {
        try {
            val wifiManager = reactApplicationContext.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
            
            // Note: We rely on the system's background scans or previously cached results.
            val scanResults: List<ScanResult> = wifiManager.scanResults ?: emptyList()
            val wifiArray: WritableArray = Arguments.createArray()

            for (result in scanResults) {
                // Skip empty or hidden SSIDs
                if (result.SSID.isNullOrEmpty() || result.SSID == "<unknown ssid>") continue

                val wifiMap: WritableMap = Arguments.createMap()
                wifiMap.putString("SSID", result.SSID)
                wifiMap.putString("BSSID", result.BSSID)
                wifiMap.putInt("level", result.level)
                wifiMap.putInt("frequency", result.frequency)
                wifiMap.putString("capabilities", result.capabilities)
                wifiArray.pushMap(wifiMap)
            }

            promise.resolve(wifiArray)
        } catch (e: Exception) {
            promise.reject("SCAN_FAILED", "Failed to retrieve WiFi scan results: ${e.message}")
        }
    }
}

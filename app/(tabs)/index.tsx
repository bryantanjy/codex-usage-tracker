import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type UsageData = {
  planType: string;
  fiveHour: {
    usedPercent: number;
    resetsAt: number | null;
  };
  weekly: {
    usedPercent: number;
    resetsAt: number | null;
  };
  freeReset: number;
  summary: {
    lifetimeTokens: number;
    peakDailyTokens: number;
    longestRunningTurnSec: number;
    currentStreakDays: number;
    longestStreakDays: number;
  };
};

const API_URL = "http://192.168.4.61:3001";
// Replace this IP with your computer's IPv4 address.

function formatResetTime(timestamp: number | null) {
  if (!timestamp) return "Unknown";

  return new Date(timestamp * 1000).toLocaleString();
}

function formatNumber(value: number) {
  return value.toLocaleString();
}

export default function HomeScreen() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadUsage() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/usage`);

      if (!response.ok) {
        throw new Error("Server returned an error");
      }

      const data = await response.json();
      setUsage(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to usage server"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsage();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Codex Usage</Text>

      {loading && <ActivityIndicator size="large" />}

      {error !== "" && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {usage && (
        <>
          <View style={styles.card}>
            <Text style={styles.label}>5-hour usage</Text>
            <Text style={styles.value}>
              {usage.fiveHour.usedPercent}%
            </Text>
            <Text style={styles.smallText}>
              Resets: {formatResetTime(usage.fiveHour.resetsAt)}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Weekly usage</Text>
            <Text style={styles.value}>
              {usage.weekly.usedPercent}%
            </Text>
            <Text style={styles.smallText}>
              Resets: {formatResetTime(usage.weekly.resetsAt)}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Lifetime tokens</Text>
            <Text style={styles.value}>
              {formatNumber(usage.summary.lifetimeTokens)}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Peak daily tokens</Text>
            <Text style={styles.value}>
              {formatNumber(usage.summary.peakDailyTokens)}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Free full resets</Text>
            <Text style={styles.value}>{usage.freeReset}</Text>
          </View>
        </>
      )}

      <Pressable style={styles.button} onPress={loadUsage}>
        <Text style={styles.buttonText}>Refresh Usage</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#111827",
    padding: 24,
    paddingTop: 70,
  },
  title: {
    color: "#ffffff",
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#1f2937",
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  label: {
    color: "#d1d5db",
    fontSize: 16,
  },
  value: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "bold",
    marginVertical: 6,
  },
  smallText: {
    color: "#9ca3af",
    fontSize: 14,
  },
  button: {
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorCard: {
    backgroundColor: "#7f1d1d",
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    color: "#ffffff",
  },
});
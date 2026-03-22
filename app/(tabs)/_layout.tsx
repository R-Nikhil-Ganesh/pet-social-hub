import { Tabs } from 'expo-router';
import { StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#FF4FA3',
        tabBarInactiveTintColor: '#8C6298',
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: styles.tabItem,
        tabBarStyle: styles.tabBar,
        tabBarButton: (props) => (
          <TouchableOpacity
            accessibilityState={props.accessibilityState}
            accessibilityLabel={props.accessibilityLabel}
            accessibilityHint={props.accessibilityHint}
            testID={props.testID}
            style={props.style}
            onLayout={props.onLayout}
            onLongPress={props.onLongPress ?? undefined}
            onPressIn={props.onPressIn ?? undefined}
            onPressOut={props.onPressOut ?? undefined}
            onPress={(event) => {
              const isSelected = Boolean(props.accessibilityState?.selected);
              if (!isSelected && Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              }
              props.onPress?.(event);
            }}
          >
            {props.children}
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          tabBarLabel: 'Feed',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          tabBarLabel: 'Community',
          tabBarIcon: ({ color, size }) => <Ionicons name="people" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="games"
        options={{
          tabBarLabel: 'Games',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="game-controller" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: 'Me',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="new-post"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 68,
    backgroundColor: '#FFE8F8',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E9A3D7',
    paddingBottom: 6,
    paddingTop: 6,
    elevation: 10,
    shadowColor: '#AD3A8A',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
  },
  tabItem: {
    paddingVertical: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
});

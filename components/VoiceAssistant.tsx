import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Mic, MicOff, Volume2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { productionVoiceAI } from '@/lib/voice-ai-production';

interface VoiceAssistantProps {
  userId: string;
  userContext: any;
  onAction?: (action: any) => void;
}

export default function VoiceAssistant({ userId, userContext, onAction }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<string>('');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const startListening = async () => {
    setIsListening(true);
    setIsProcessing(false);
    
    // Start pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Simulate voice recording (in production, use actual speech recognition)
    setTimeout(() => {
      stopListening();
    }, 3000);
  };

  const stopListening = async () => {
    setIsListening(false);
    setIsProcessing(true);
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);

    try {
      // Simulate processing voice command
      const mockText = "What's my balance?";
      
      const response = await productionVoiceAI.processTextCommand(
        mockText,
        userId,
        userContext
      );

      setLastResponse(response.text);
      
      // Execute actions
      if (response.actions && onAction) {
        response.actions.forEach(action => onAction(action));
      }

      // Play audio response if available
      if (response.audio) {
        // In production, play the audio buffer
        console.log('Playing audio response');
      }
    } catch (error) {
      console.error('Voice processing error:', error);
      setLastResponse("I'm sorry, I couldn't process that. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePress = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.voiceButton}
        onPress={handlePress}
        disabled={isProcessing}
      >
        <Animated.View style={[styles.buttonContent, { transform: [{ scale: pulseAnim }] }]}>
          <LinearGradient
            colors={isListening ? ['#EF4444', '#DC2626'] : ['#8B5CF6', '#7C3AED']}
            style={styles.gradient}
          >
            {isProcessing ? (
              <Volume2 size={24} color="white" />
            ) : isListening ? (
              <MicOff size={24} color="white" />
            ) : (
              <Mic size={24} color="white" />
            )}
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>

      {lastResponse ? (
        <View style={styles.responseContainer}>
          <Text style={styles.responseText}>{lastResponse}</Text>
        </View>
      ) : null}

      <Text style={styles.statusText}>
        {isProcessing
          ? 'Processing...'
          : isListening
          ? 'Listening...'
          : 'Tap to speak'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
  },
  voiceButton: {
    marginBottom: 16,
  },
  buttonContent: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  responseContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  responseText: {
    fontSize: 14,
    color: '#111827',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
  },
});
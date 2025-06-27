import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Animated,
} from 'react-native';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react-native';
import { voiceAI, VoiceCommand, VoiceResponse } from '../lib/voice-ai';

interface VoiceAssistantProps {
  onNavigate?: (screen: string, params?: any) => void;
  onAction?: (action: any) => void;
}

export default function VoiceAssistant({ onNavigate, onAction }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResponse, setLastResponse] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (isListening) {
      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isListening]);

  const handleVoiceButtonPress = async () => {
    console.log('🎤 Voice button pressed, isListening:', isListening);
    
    if (isListening) {
      await stopListening();
    } else {
      await startListening();
    }
  };

  const startListening = async () => {
    try {
      setIsListening(true);
      setShowModal(true);
      console.log('🎤 Starting voice command...');
      
      await voiceAI.startListening();
      
      // Auto-stop after 5 seconds for better voice recognition
      setTimeout(() => {
        if (isListening) {
          console.log('🔇 Auto-stopping voice after 5 seconds');
          stopListening();
        }
      }, 5000);
    } catch (error) {
      console.error('❌ Error starting voice command:', error);
      setIsListening(false);
      setShowModal(false);
    }
  };

  const stopListening = async () => {
    try {
      setIsListening(false);
      setIsProcessing(true);
      
      console.log('🔇 Processing voice command...');
      const command = await voiceAI.stopListening();
      
      if (command) {
        console.log('🎯 Voice command detected:', command);
        await executeCommand(command);
      } else {
        setLastResponse("I didn't catch that. Please try again.");
      }
    } catch (error) {
      console.error('❌ Error processing voice command:', error);
      setLastResponse('Sorry, there was an error processing your command.');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setShowModal(false), 2000);
    }
  };

  const executeCommand = async (command: VoiceCommand) => {
    try {
      const response: VoiceResponse = await voiceAI.executeVoiceCommand(command);
      
      setLastResponse(response.text);
      
      // Play audio response if available
      if (response.audioUrl) {
        await voiceAI.playAudioResponse(response.audioUrl);
      }
      
      // Execute any navigation or actions
      if (response.action) {
        setTimeout(() => {
          if (response.action?.type === 'navigate' && onNavigate) {
            onNavigate(response.action.data.screen, response.action.data);
          } else if (onAction) {
            onAction(response.action);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('❌ Error executing voice command:', error);
      setLastResponse('Sorry, I encountered an error.');
    }
  };

  const getButtonColor = () => {
    if (isProcessing) return '#F59E0B'; // Orange for processing
    if (isListening) return '#EF4444'; // Red for listening
    return '#8B5CF6'; // Purple for ready
  };

  const getButtonIcon = () => {
    if (isProcessing) return <Volume2 size={24} color="white" />;
    if (isListening) return <MicOff size={24} color="white" />;
    return <Mic size={24} color="white" />;
  };

  return (
    <>
      {/* Floating Voice Button */}
      <Animated.View style={[
        styles.floatingButton,
        { transform: [{ scale: pulseAnim }] }
      ]}>
        <TouchableOpacity
          style={[styles.voiceButton, { backgroundColor: getButtonColor() }]}
          onPress={handleVoiceButtonPress}
          disabled={isProcessing}
        >
          {getButtonIcon()}
        </TouchableOpacity>
      </Animated.View>

      {/* Voice Command Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {isListening && (
              <>
                <Animated.View style={[
                  styles.listeningIndicator,
                  { transform: [{ scale: pulseAnim }] }
                ]}>
                  <Mic size={48} color="#8B5CF6" />
                </Animated.View>
                <Text style={styles.listeningText}>Listening...</Text>
                <Text style={styles.instructionText}>
                  Try saying: "Check balance", "Send 5 algos", or "Scan QR code"
                </Text>
              </>
            )}
            
            {isProcessing && (
              <>
                <Volume2 size={48} color="#F59E0B" />
                <Text style={styles.processingText}>Processing...</Text>
              </>
            )}
            
            {!isListening && !isProcessing && lastResponse && (
              <>
                <Volume2 size={48} color="#10B981" />
                <Text style={styles.responseText}>{lastResponse}</Text>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    zIndex: 1000,
  },
  voiceButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    minWidth: 280,
    maxWidth: '90%',
  },
  listeningIndicator: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  listeningText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  processingText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 15,
  },
  responseText: {
    fontSize: 16,
    color: '#1F2937',
    marginTop: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { FlatList, Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";

interface Props {
  label: string;
  data: any[];
  selectedValue: any;
  onValueChange: (value: any) => void;
  disabled?: boolean;
}

export default function LocationPicker({
  label,
  data,
  selectedValue,
  onValueChange,
  disabled = false
}: Props
) {
  const [visible, setVisible] = React.useState(false);

  const safeData = data ?? [];

  const selectedItem = safeData.find(
    (item) => item.id === selectedValue
  );

  return (
    <View style={[styles.wrapper, disabled && { opacity: 0.5 }]}>
      <ThemedText style={styles.label}>{label}</ThemedText>

      <TouchableOpacity
        style={styles.selector}
        onPress={() => !disabled && setVisible(true)}
        activeOpacity={0.7}
      >
        <ThemedText style={selectedItem ? styles.textActive : styles.textPlaceholder}>
          {selectedItem ? selectedItem.name : `Chọn ${label}`}
        </ThemedText>
        <Ionicons name="chevron-down" size={18} color="#999" />
      </TouchableOpacity>

      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <ThemedText type="subtitle">{label}</ThemedText>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Ionicons name="close" size={24} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={data || []}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.item}
                  onPress={() => {
                    onValueChange(item.id);
                    setVisible(false);
                  }}
                >
                  <ThemedText>{item.name}</ThemedText>
                  {selectedValue === item.id && <Ionicons name="checkmark" size={20} color="green" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
  },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee'
  },
  textPlaceholder: { color: '#aaa' },
  textActive: { color: '#000', fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, height: '60%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  item: { padding: 18, borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0', flexDirection: 'row', justifyContent: 'space-between' }
});
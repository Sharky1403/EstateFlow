import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 11 },
  title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  section: { marginBottom: 16 },
  heading: { fontSize: 13, fontWeight: 'bold', marginBottom: 6, borderBottom: '1px solid #ccc', paddingBottom: 4 },
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { width: 140, color: '#555' },
  value: { flex: 1 },
  clause: { marginBottom: 10 },
  clauseTitle: { fontWeight: 'bold', marginBottom: 2 },
})

export function LeaseDocument({ lease }: { lease: any }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>RENTAL AGREEMENT</Text>
        <View style={styles.section}>
          <Text style={styles.heading}>Property Details</Text>
          <View style={styles.row}><Text style={styles.label}>Building:</Text><Text style={styles.value}>{lease?.units?.buildings?.name}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Unit:</Text><Text style={styles.value}>{lease?.units?.unit_number}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Address:</Text><Text style={styles.value}>{lease?.units?.buildings?.address}</Text></View>
        </View>
        <View style={styles.section}>
          <Text style={styles.heading}>Lease Terms</Text>
          <View style={styles.row}><Text style={styles.label}>Tenant:</Text><Text style={styles.value}>{lease?.profiles?.full_name}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Start Date:</Text><Text style={styles.value}>{lease?.start_date}</Text></View>
          <View style={styles.row}><Text style={styles.label}>End Date:</Text><Text style={styles.value}>{lease?.end_date}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Monthly Rent:</Text><Text style={styles.value}>${lease?.monthly_rent}</Text></View>
        </View>
        {lease?.clauses?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.heading}>Special Clauses</Text>
            {lease.clauses.map((c: any, i: number) => (
              <View key={i} style={styles.clause}>
                <Text style={styles.clauseTitle}>{c.title}</Text>
                <Text>{c.body}</Text>
              </View>
            ))}
          </View>
        )}
        <View style={{ marginTop: 40 }}>
          <Text style={styles.heading}>Signatures</Text>
          <View style={{ flexDirection: 'row', marginTop: 20 }}>
            <View style={{ flex: 1 }}>
              <Text>Landlord Signature:</Text>
              <View style={{ borderBottom: '1px solid #000', marginTop: 30, marginRight: 20 }} />
            </View>
            <View style={{ flex: 1 }}>
              <Text>Tenant Signature:</Text>
              <View style={{ borderBottom: '1px solid #000', marginTop: 30 }} />
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}

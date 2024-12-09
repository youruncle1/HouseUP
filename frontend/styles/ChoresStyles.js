// frontend/styles/ChoresStyles.js
import {StyleSheet} from 'react-native';

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F7F7',
    },
    list: {
        marginHorizontal: 10,
        marginVertical: 5,
    },
    choreItem: {
        flexDirection: 'row',
        backgroundColor: '#DDD',
        padding: 10,
        marginBottom: 5,
        alignItems: 'center',
        borderRadius: 5,
    },
    choreHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    profileImage:{width:40, height:40,marginLeft:10},
    choreTextContainer: { flex: 1, marginHorizontal: 10 },
    choreText: { fontSize: 16, color: '#333' },
    completedChoreText: { textDecorationLine: 'line-through', color: 'gray' },
    choreAssignedTo: { fontSize: 12, color: '#555' },
    completeButton: {
        backgroundColor: 'green',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
    },
    takeOverButton: {
        backgroundColor: 'orange',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
    },
    buttonText: { color: '#fff' },
    addButtonToggle: {
        position: 'absolute',
        bottom: 80,
        right: 20,
    },
    form: {
        position: 'absolute',
        bottom: 10,
        left: 10,
        right: 10,
        backgroundColor: '#eee',
        padding: 10,
        borderRadius: 5,
    },
    input: {
        backgroundColor: '#fff',
        marginBottom: 10,
        padding: 10,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    addButton: {
        backgroundColor: '#6200EE',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center'
    },
    addButtonText: { color: '#fff', fontWeight: 'bold' },
    sectionHeader: { fontSize: 18, fontWeight: 'bold', marginHorizontal:10, marginTop:20 },
});

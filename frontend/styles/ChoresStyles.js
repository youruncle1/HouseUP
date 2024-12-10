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
        marginLeft: 10,
        marginRight:10,
        alignItems: 'center',
        borderRadius: 5,
    },
    choreHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
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
        backgroundColor: '#eee',
        padding: 10,
        borderRadius: 5,
        marginBottom: 20,
    },
    input: {
        backgroundColor: '#fff',
        marginBottom: 10,
        padding: 10,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    inputpicker:{
        backgroundColor:'#fff',
        marginBottom:10,
        borderRadius:10,
    },
    addButton: {
        backgroundColor: '#6200EE',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
    },
    addButtonText: { color: '#fff', fontWeight: 'bold' },
    sectionHeader: { fontSize: 18, fontWeight: 'bold', marginHorizontal:10, marginTop:20 },

    // New styles for AddChoreScreen
    addChoreContainer: {
        flex:1,
        backgroundColor:'#fff',
        padding:20
    },
    addChoreTitle: {
        fontSize:20,
        fontWeight:'bold',
        marginBottom:20,
        marginTop:20,
    },

    // Stats screen styles
    statsHeader: {
        flexDirection: 'row',
        backgroundColor: '#6200EE',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 15,
        justifyContent: 'space-between'
    },
    statsHeaderTitle: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
    },
    statsContent: {
        padding: 10
    },
    statsSectionHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10
    },
    statsItem: {
        backgroundColor: '#DDD',
        padding: 10,
        marginBottom: 10,
        borderRadius: 5
    },
    statsUserName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5
    },
    statsText: {
        fontSize: 14,
        marginBottom: 2
    },
    statsLoadingContainer: {
        flex:1,
        justifyContent:'center',
        alignItems:'center'
    },
    iconButton: {
        marginHorizontal: 10
    },
});

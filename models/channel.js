import * as channelService from "@services/channel";

export default {
  namespace: "channel",
  state: {
    detail: {
      status: 1
    },
    appList: []
  },
  reducers: {
    updateDetail(state, { payload = {} }) {
      return {
        ...state,
        detail: {
          ...state.detail,
          ...payload
        }
      };
    },
    updateAppList(state, { payload }) {
      return { ...state, appList: payload };
    },
    resetState(state) {
      return { ...state, detail: {}, appList: [] };
    }
  },
  effects: {
    *fetchDetail({ payload }, { call, put }) {
      const detail = yield call(channelService.fetchDetail, { id: payload });
      yield put({
        type: "updateDetail",
        payload: detail || {}
      });
    },
    *fetchAppList(p, { call, put }) {
      const data = yield call(channelService.fetchAppList, {});
      yield put({
        type: "updateAppList",
        payload: (data || []).map(d => ({
          label: d.app_name,
          value: d.app_id
        }))
      });
    },
    *addChannel({ payload }, { call, select }) {
      const { detail } = yield select(state => state.channel);
      yield call(channelService.addChannel, { ...detail });
      payload.callback();
    },
    *updateChannel({ payload }, { call, select }) {
      const { detail } = yield select(state => state.channel);
      yield call(channelService.updateChannel, { ...detail });
      payload.callback();
    }
  }
};

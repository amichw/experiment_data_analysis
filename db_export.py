import pandas as pd

RT = 'reaction_time'


def increment_index(df):
    df.index = range(1, len(df.index) + 1)


def create_response_columns(df):
    df['time_target'] = ((df['reaction_type'] == 1) & (df['target_shown'] == 0)).astype(int)
    df['time_no_target'] = ((df['reaction_type'] == 1) & (df['target_shown'] == 2)).astype(int)
    df['late_target'] = ((df['reaction_type'] == 0) & (df['target_shown'] == 0)).astype(int)
    df['late_no_target'] = ((df['reaction_type'] == 0) & (df['target_shown'] == 2)).astype(int)
    df['early_target'] = ((df['reaction_type'] == -1) & (df['target_shown'] == 0)).astype(int)
    df['early_no_target'] = ((df['reaction_type'] == -1) & (df['target_shown'] == 2)).astype(int)


def create_percent_columns(df, new_df, groups):
    gb = df.groupby(groups)
    new_df['% time_target'] = gb['time_target'].mean().tolist()
    new_df['% late_no_target'] = gb['late_no_target'].mean().tolist()
    new_df['% time_no_target'] = gb['time_no_target'].mean().tolist()
    new_df['% late_target'] = gb['late_target'].mean().tolist()
    new_df['% early_target'] = gb['early_target'].mean().tolist()
    new_df['% early_no_target'] = gb['early_no_target'].mean().tolist()
    new_df['% mistake'] = gb['mistake'].mean().to_list()

    for col in [x for x in new_df.columns if x.startswith('% ')]:  # show as percent
        new_df[col] *= 100


def export_to_excel(df, output_path, analyze_part=True):
    # data = pd.read_excel(input_path)
    data = df
    data.columns = data.columns.map(lambda x: x.strip())
    # data = data.drop([''], axis=1)
    data['user_code'] = data['user_code'].astype(str).apply(lambda x: x.strip())
    # legit_users = ['A_AYGE9048', 'A_ADGL4716', 'A_TAMA9557', 'A_TZGO7936', 'B_ITKI6815', 'B_NAMA0554', 'B_NEBA1519']
    # data = data[data['user_code'].isin(legit_users)]  # for now. only real trials.
    data = data.drop_duplicates(subset=['user_code', 'block_num', 'trial_num'])
    if analyze_part:
        data['part'] = data.apply(lambda row: 1 if row['block_num'] < 7 else 2, axis=1)  # data['block_num']<7
        data['legit'] = (data['reaction_type']==1).astype(int)
    create_response_columns(data)
    data['mistake'] = ((data['time_target'] == 0) & (data['late_no_target'] == 0)).astype(int)
    # dataCorrectPositive = data[(data[RT] > 0) & (data[RT] < 3000) & (data['target_shown']==0) ]
    data_correct_positive = data[(data['reaction_type'] == 1) & (data['target_shown'] == 0)]

    #  ===============     BLOCK       ====================
    # mean RT by block
    by_block = data_correct_positive.groupby(['user_code', 'block_num'])
    block = by_block[RT].mean().reset_index()
    block['RT std'] = by_block[RT].std().to_list()
    block['RT long'] = data_correct_positive[data_correct_positive['long_2'] == 2].groupby(['user_code', 'block_num'])[RT].mean().to_list()
    block['RT long std'] = data_correct_positive[data_correct_positive['long_2'] == 2].groupby(['user_code', 'block_num'])[RT].std().to_list()
    block['RT short'] = data_correct_positive[data_correct_positive['long_2'] == 1].groupby(['user_code', 'block_num'])[RT].mean().to_list()
    block['RT short std'] = data_correct_positive[data_correct_positive['long_2'] == 1].groupby(['user_code', 'block_num'])[RT].std().to_list()
    block['% mistake'] = data.groupby(['user_code', 'block_num'])['mistake'].mean().to_list()
    create_percent_columns(data, block, ['user_code', 'block_num'])
    block['trial type'] = data.groupby(['user_code', 'block_num'])['trial_type'].unique().to_list()

    #  ===============     PART - TRIAL TYPE       ====================
    # CONDITION:
    # mean RT by condition and part
    if analyze_part:
        by_type = data_correct_positive.groupby(['user_code', 'part', 'trial_type'])
        part_type = by_type[RT].mean().reset_index()
        part_type['std'] = by_type[RT].std().to_list()
        part_type['RT long'] = data_correct_positive[data_correct_positive['long_2'] == 2].groupby(['user_code', 'part', 'trial_type'])[RT].mean().to_list()
        part_type['RT long std'] = data_correct_positive[data_correct_positive['long_2'] == 2].groupby(['user_code', 'part', 'trial_type'])[RT].std().to_list()
        part_type['RT short'] = data_correct_positive[data_correct_positive['long_2'] == 1].groupby(['user_code', 'part', 'trial_type'])[RT].mean().to_list()
        part_type['RT short std'] = data_correct_positive[data_correct_positive['long_2'] == 1].groupby(['user_code', 'part', 'trial_type'])[RT].std().to_list()
        part_type['% mistake'] = data.groupby(['user_code', 'part', 'trial_type'])['mistake'].mean().to_list()
        create_percent_columns(data, part_type, ['user_code', 'part', 'trial_type'])

    # ========================================= ==================================================
    #  ===============    CONDITION       ====================
    # CONDITION:
    # mean RT by condition
    condition = data_correct_positive.groupby(['user_code', 'trial_type'])[RT].mean().reset_index()
    condition['std'] = data_correct_positive.groupby(['user_code', 'trial_type'])[RT].std().to_list()
    condition['RT long'] = data_correct_positive[data_correct_positive['long_2'] == 2].groupby(['user_code', 'trial_type'])[RT].mean().to_list()
    condition['RT long std'] = data_correct_positive[data_correct_positive['long_2'] == 2].groupby(['user_code', 'trial_type'])[RT].std().to_list()
    condition['RT short'] = data_correct_positive[data_correct_positive['long_2'] == 1].groupby(['user_code', 'trial_type'])[RT].mean().to_list()
    condition['RT short std'] = data_correct_positive[data_correct_positive['long_2'] == 1].groupby(['user_code', 'trial_type'])[RT].std().to_list()
    condition['% mistake'] = data.groupby(['user_code', 'trial_type'])['mistake'].mean().to_list()
    create_percent_columns(data, condition, ['user_code', 'trial_type'])

    # ========================================= ==================================================

    # PART:
    if analyze_part:
        part = data_correct_positive.groupby(['user_code', 'part'])[RT].mean().reset_index()
        part['STD'] = data_correct_positive.groupby(['user_code', 'part'])[RT].std().to_list()
        # % Nan by PART
        part['% mistake'] = data.groupby(['user_code', 'part'])['mistake'].mean().to_list()
        create_percent_columns(data, part, ['user_code', 'part'])

    # TOTAL by user::
    user = data_correct_positive.groupby(['user_code'])[RT].mean().reset_index()
    user['STD'] = data_correct_positive.groupby(['user_code'])[RT].std().to_list()
    user['% mistake'] = data.groupby(['user_code'])['mistake'].mean().to_list()
    user['% mistake'] *= 100
    create_percent_columns(data, user, ['user_code'])
    user['count'] = data.groupby(['user_code'])['row'].count().to_list()

    # RATIOS:
    by_trial_type = data.groupby(['user_code', 'trial_type'])[RT].mean().reset_index()  # data or positiveData?!
    user['Rhythmic/random'] = (by_trial_type[by_trial_type['trial_type'] == 1][RT].tolist() / by_trial_type[by_trial_type['trial_type'] == 3][RT]).to_list()
    user['Interval/random'] = (by_trial_type[by_trial_type['trial_type'] == 2][RT].tolist() / by_trial_type[by_trial_type['trial_type'] == 3][RT]).to_list()

    # by REACTION TYPE:
    reaction = data.groupby(['user_code', 'reaction_type'])[RT].mean().reset_index()
    reaction['std'] = data.groupby(['user_code', 'reaction_type'])[RT].std().to_list()
    reaction['count'] = data.groupby(['user_code', 'reaction_type'])[RT].count().to_list()
    # TOTAL:
    print('General mean:', data_correct_positive[RT].mean())

    increment_index(block)
    increment_index(condition)
    if analyze_part:
        increment_index(part_type)
        increment_index(part)
    increment_index(reaction)
    increment_index(user)

    with pd.ExcelWriter(output_path) as writer:
        block.to_excel(writer, sheet_name='by block')
        condition.to_excel(writer, sheet_name='by condition')
        if analyze_part:
            part_type.to_excel(writer, sheet_name='condition by part')
            part.to_excel(writer, sheet_name='by part')
        reaction.to_excel(writer, sheet_name='by reaction')
        user.to_excel(writer, sheet_name='by user')


if __name__ == '__main__':
    input_path = 'db4.csv'
    # data = pd.read_csv(input_path), 'db_data.xlsx'
    export_to_excel(pd.read_csv(input_path), 'db_data.xlsx')
    exit(42)
    #  ======  for old data:
    xls = pd.ExcelFile(input_path)
    for sheet in xls.sheet_names:
        data = pd.read_excel(input_path, sheet_name=sheet)
        data = data.dropna()
        # data[' reaction_time'] =  data[' reaction_time'] * 1000
        output = 'dafna_{}.xlsx'.format(sheet)
        export_to_excel(data, output, True)
        exit(35)

